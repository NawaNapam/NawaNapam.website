"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerConnectionHandlers = registerConnectionHandlers;
const redisClient_1 = require("../utils/redis/redisClient");
const matchHandler_1 = require("./matchHandler");
const finalizeHandler_1 = require("./finalizeHandler");
const authHandler_1 = require("./authHandler");
const heartbeatHandler_1 = require("./heartbeatHandler");
const chatHandlers_1 = require("./chatHandlers");
const rtchandler_1 = require("./rtchandler");
const roomState = new Map();
function registerConnectionHandlers(io) {
    io.on("connection", (socket) => {
        console.log("✅ Socket connected:", socket.id);
        (0, rtchandler_1.registerRtcHandlers)(io, socket);
        // --- auth/heartbeat/match ---
        socket.on("auth", (payload) => (0, authHandler_1.handleAuth)(socket, payload));
        socket.on("heartbeat", (payload) => (0, heartbeatHandler_1.handleHeartbeat)(socket, payload));
        socket.on("match:request", (payload) => (0, matchHandler_1.handleMatchRequest)(io, socket, payload));
        // --- chat handlers ---
        // NOTE: room:join is called programmatically in matchHandler
        // But we keep this listener for explicit client joins (e.g., WebRTC rejoins)
        socket.on("room:join", (payload) => {
            console.log(`[connection] Explicit room:join from ${socket.data.userId}:`, payload);
            (0, chatHandlers_1.handleChatRoomJoin)(io, socket, payload);
        });
        socket.on("chat:send", (payload) => (0, chatHandlers_1.handleChatSend)(io, socket, payload));
        // --- end room (finalizes + emits "Chat ended") ---
        socket.on("end:room", (payload) => (0, finalizeHandler_1.handleEndRoom)(io, socket, payload));
        // --- disconnect housekeeping ---
        socket.on("disconnect", () => __awaiter(this, void 0, void 0, function* () {
            const userId = socket.data.userId;
            if (!userId)
                return;
            console.log(`❌ User ${userId} disconnecting, socket: ${socket.id}`);
            try {
                yield redisClient_1.redis.hset(`user:${userId}`, "status", "offline");
                // Clean up availability pools
                yield redisClient_1.redis.srem("available", userId);
                yield redisClient_1.redis.zrem("available_by_time", userId);
                // Clean up any active rooms
                const roomId = socket.data.currentRoomId;
                if (roomId) {
                    console.log(`[disconnect] Cleaning up room ${roomId} for user ${userId}`);
                    socket.to(roomId).emit("rtc:peer-left");
                    socket.to(roomId).emit("chat:system", {
                        text: "User disconnected",
                        roomId,
                    });
                    // Mark the room as ended
                    yield redisClient_1.redis.hset(`user:${userId}`, "currentRoom", "");
                }
            }
            catch (err) {
                console.error("[disconnect] Error during cleanup:", err);
            }
        }));
    });
    // Subscribe to pubsub for cross-server match notifications
    redisClient_1.sub.subscribe("pubsub:presence");
    redisClient_1.sub.on("message", (channel, message) => __awaiter(this, void 0, void 0, function* () {
        if (channel !== "pubsub:presence")
            return;
        // message format: "matched|roomId|u1|u2" or "ended|roomId"
        const parts = String(message).split("|");
        if (parts[0] === "matched") {
            const [, roomId, u1, u2] = parts;
            try {
                // This handles cross-server scenarios where users are on different instances
                // For same-server, we already handled it in matchHandler directly
                const u1Hash = yield redisClient_1.redis.hgetall(`user:${u1}`);
                const u2Hash = yield redisClient_1.redis.hgetall(`user:${u2}`);
                const u1Name = u1Hash.username || u1Hash.name || u1;
                const u2Name = u2Hash.username || u2Hash.name || u2;
                console.log(`[pubsub] Match notification: ${u1} <-> ${u2} in room ${roomId}`);
                // Only emit if we haven't already (this is for cross-server cases)
                if (u1Hash.socketId) {
                    const socket1 = io.sockets.sockets.get(u1Hash.socketId);
                    if (socket1 && !socket1.data.currentRoomId) {
                        socket1.emit("match:found", {
                            peerId: u2,
                            peerUsername: u2Name,
                            roomId,
                        });
                        yield (0, chatHandlers_1.handleChatRoomJoin)(io, socket1, { roomId });
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
                        yield (0, chatHandlers_1.handleChatRoomJoin)(io, socket2, { roomId });
                    }
                }
            }
            catch (err) {
                console.error("[pubsub] Error handling matched event:", err, {
                    roomId,
                    u1,
                    u2,
                });
            }
        }
        else if (parts[0] === "ended") {
            const [, roomId] = parts;
            console.log("[pubsub] Room ended notification:", roomId);
            io.to(roomId).emit("chat:system", { text: "Chat ended", roomId });
        }
    }));
}
