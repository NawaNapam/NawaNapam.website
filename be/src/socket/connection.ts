import { Socket, Server } from "socket.io";
import { sub, redis } from "../utils/redis/redisClient";
import { handleMatchRequest } from "./matchHandler";
import { handleEndRoom } from "./finalizeHandler";
import { handleAuth } from "./authHandler";
import { handleHeartbeat } from "./heartbeatHandler";
import { handleChatRoomJoin, handleChatSend } from "./chatHandlers";
import { registerRtcHandlers } from "./rtchandler";

type RoomMeta = {
  ended?: boolean;
};
const roomState = new Map<string, RoomMeta>();

export function registerConnectionHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("✅ Socket connected:", socket.id);

    registerRtcHandlers(io, socket);

    // --- auth/heartbeat/match ---
    socket.on("auth", (payload) => handleAuth(socket, payload));
    socket.on("heartbeat", (payload) => handleHeartbeat(socket, payload));
    socket.on("match:request", (payload) =>
      handleMatchRequest(io, socket, payload)
    );

    // --- chat handlers ---
    // NOTE: room:join is called programmatically in matchHandler
    // But we keep this listener for explicit client joins (e.g., WebRTC rejoins)
    socket.on("room:join", (payload) => {
      console.log(
        `[connection] Explicit room:join from ${socket.data.userId}:`,
        payload
      );
      handleChatRoomJoin(io, socket, payload);
    });

    socket.on("chat:send", (payload) => handleChatSend(io, socket, payload));

    // --- end room (finalizes + emits "Chat ended") ---
    socket.on("end:room", (payload) => handleEndRoom(io, socket, payload));

    // --- disconnect housekeeping ---
    socket.on("disconnect", async () => {
      const userId = socket.data.userId;
      if (!userId) return;

      console.log(`❌ User ${userId} disconnecting, socket: ${socket.id}`);

      try {
        await redis.hset(`user:${userId}`, "status", "offline");

        // Clean up availability pools
        await redis.srem("available", userId);
        await redis.zrem("available_by_time", userId);

        // Clean up any active rooms
        const roomId = socket.data.currentRoomId;
        if (roomId) {
          console.log(
            `[disconnect] Cleaning up room ${roomId} for user ${userId}`
          );
          socket.to(roomId).emit("rtc:peer-left");
          socket.to(roomId).emit("chat:system", {
            text: "User disconnected",
            roomId,
          });

          // Mark the room as ended
          await redis.hset(`user:${userId}`, "currentRoom", "");
        }
      } catch (err) {
        console.error("[disconnect] Error during cleanup:", err);
      }
    });
  });

  // Subscribe to pubsub for cross-server match notifications
  sub.subscribe("pubsub:presence");
  sub.on("message", async (channel, message) => {
    if (channel !== "pubsub:presence") return;

    // message format: "matched|roomId|u1|u2" or "ended|roomId"
    const parts = String(message).split("|");

    if (parts[0] === "matched") {
      const [, roomId, u1, u2] = parts;

      try {
        // This handles cross-server scenarios where users are on different instances
        // For same-server, we already handled it in matchHandler directly
        const u1Hash = await redis.hgetall(`user:${u1}`);
        const u2Hash = await redis.hgetall(`user:${u2}`);

        const u1Name = u1Hash.username || u1Hash.name || u1;
        const u2Name = u2Hash.username || u2Hash.name || u2;

        console.log(
          `[pubsub] Match notification: ${u1} <-> ${u2} in room ${roomId}`
        );

        // Only emit if we haven't already (this is for cross-server cases)
        if (u1Hash.socketId) {
          const socket1 = io.sockets.sockets.get(u1Hash.socketId);
          if (socket1 && !socket1.data.currentRoomId) {
            socket1.emit("match:found", {
              peerId: u2,
              peerUsername: u2Name,
              roomId,
            });
            await handleChatRoomJoin(io, socket1, { roomId });
          }
        }

        if (u2Hash.socketId) {
          const socket2 = io.sockets.sockets.get(u2Hash.socketId);
          if (socket2 && !socket2.data.currentRoomId) {
            socket2.emit("match:found", {
              peerId: u1,
              peerUsername: u1Name,
              roomId,
            });
            await handleChatRoomJoin(io, socket2, { roomId });
          }
        }
      } catch (err) {
        console.error("[pubsub] Error handling matched event:", err, {
          roomId,
          u1,
          u2,
        });
      }
    } else if (parts[0] === "ended") {
      const [, roomId] = parts;
      console.log("[pubsub] Room ended notification:", roomId);
      io.to(roomId).emit("chat:system", { text: "Chat ended", roomId });
    }
  });
}
