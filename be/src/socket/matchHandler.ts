import type { Server, Socket } from "socket.io";
import { redis } from "../utils/redis/redisClient";
import { scripts } from "../utils/redis/scripts";
import { handleChatRoomJoin } from "./chatHandlers";

const STALE_MS = Number(process.env.STALE_MS || 30_000);

export async function handleMatchRequest(io: Server, socket: Socket) {
  const userId = socket.data.userId as string;
  if (!userId) return socket.emit("match:error", "not-authenticated");

  const now = Date.now();

  try {
    const u = await redis.hgetall(`user:${userId}`);
    if (u && (u.status === "matched" || (u.currentRoom && u.currentRoom !== ""))) {
      console.warn("[match] user already in room", { userId, status: u.status, currentRoom: u.currentRoom });
      return socket.emit("match:error", "already-in-room");
    }

    // ✅ Mark user as available in their hash too (and refresh lastSeen, clear any stale currentRoom)
    await redis.hset(
      `user:${userId}`,
      "status", "available",
      "lastSeen", String(now),
      "currentRoom", ""
    );

    // Ensure requester is visible in pools
    await redis.sadd("available", userId);
    await redis.zadd("available_by_time", now, userId);

    // Lua decides the peer and generates the canonical roomId (requester-now-candidate)
    const raw: any = await redis.evalsha(
      scripts.matchSha!, 0,
      userId,
      String(now),
      String(STALE_MS)
    );

    let parsed: any = null;
    if (typeof raw === "string" && raw.startsWith("{")) {
      try { parsed = JSON.parse(raw); } catch {}
    } else if (raw && typeof raw === "object") {
      parsed = raw;
    }

    if (parsed) {
      if (parsed.ok) {
        const peerId = parsed.candidate;
        const rid = parsed.roomId; // authoritative

        // requester is matched now
        await redis.hset(`user:${userId}`, "status", "matched", "currentRoom", rid);

        socket.emit("match:found", { peerId, roomId: rid });

        // server-join requester immediately
        await handleChatRoomJoin(io, socket, { roomId: rid });
        console.log("[match] requester joined room", { userId, roomId: rid, peerId });
        return;
      }

      const errCode = String(parsed.err || "").toUpperCase();
      if (errCode === "NO_PEER" || errCode === "STALE_PEER" || errCode === "NOT_AVAILABLE") {
        // keep them available while queued
        await redis.hset(`user:${userId}`, "status", "available", "lastSeen", String(Date.now()));
        socket.emit("match:queued");
        console.log("[match] queued", { userId });
        return;
      }

      console.warn("[match] error from script", { userId, errCode, raw: parsed });
      return socket.emit("match:error", errCode || "match_failed");
    }

    // Default graceful path: queue
    await redis.hset(`user:${userId}`, "status", "available", "lastSeen", String(Date.now()));
    socket.emit("match:queued");
    console.log("[match] queued (default path)", { userId });
    return;
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes("NO_PEER")) {
      await redis.hset(`user:${userId}`, "status", "available", "lastSeen", String(Date.now()));
      socket.emit("match:queued");
      console.log("[match] queued via NO_PEER", { userId });
      return;
    }
    console.error("[match] error", e, { userId });
    return socket.emit("match:error", msg);
  }
}
