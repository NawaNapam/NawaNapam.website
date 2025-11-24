// handlers/finalizeHandler.ts
import type { Server, Socket } from "socket.io";
import { redis } from "../utils/redis/redisClient";
import { scripts } from "../utils/redis/scripts";

export async function handleEndRoom(
  io: Server,
  socket: Socket,
  payload: any
) {
  const roomId = payload?.roomId;
  if (!roomId) return socket.emit("end:error", "roomId required");

  try {
    // finalize room in Redis (publishes 'ended|roomId' on your pubsub)
    const raw = await redis.evalsha(
      scripts.finalizeSha!,
      0,
      roomId,
      String(Date.now())
    );
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

    if (!parsed || !parsed.ok) {
      const errMsg = parsed?.err || "no-room";
      return socket.emit("end:error", errMsg);
    }

    // 1) Confirm to the caller
    socket.emit("end:ok", {
      roomId: parsed.roomId,
      participants: parsed.participants || [],
      partsMeta: parsed.partsMeta || {},
      startedAt: parsed.startedAt ?? null,
      finalizedAt: parsed.finalizedAt ?? null,
      state: parsed.state ?? null,
    });

    // 2) Broadcast system message to both peers immediately (don’t wait on pubsub)
    io.to(roomId).emit("chat:system", { text: "Chat ended" });

    // 3) (Optional) force leave locally to prevent further messages
    io.in(roomId).socketsLeave(roomId);
  } catch (err: any) {
    console.error("finalize error", err);
    try {
      await redis.lpush(
        "persist:retry",
        JSON.stringify({
          roomId,
          error: String(err?.message ?? err),
          at: Date.now(),
        })
      );
    } catch (pushErr) {
      console.error("failed to push persist:retry", pushErr);
    }
    socket.emit("end:error", String(err?.message ?? err));
  }
}
