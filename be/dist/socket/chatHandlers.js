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
exports.handleChatRoomJoin = handleChatRoomJoin;
exports.handleChatSend = handleChatSend;
exports.handleChatRoomLeave = handleChatRoomLeave;
const redisClient_1 = require("../utils/redis/redisClient");
/**
 * When a user emits "room:join", they're telling us they want to join a chat room.
 * We'll:
 * 1. Add them to the Socket.IO room
 * 2. Store their current room in socket.data
 * 3. Update their Redis hash with the room
 */
function handleChatRoomJoin(io, socket, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const { roomId } = payload;
        if (!roomId) {
            console.warn("[chatHandler] room:join with no roomId");
            return;
        }
        const userId = socket.data.userId;
        const username = socket.data.username || userId;
        console.log(`[chatHandler] User ${userId} (${username}) joining room: ${roomId}`);
        // Join the Socket.IO room
        yield socket.join(roomId);
        // Store current room in socket data
        socket.data.currentRoomId = roomId;
        // Update Redis to track which room this user is in
        if (userId) {
            try {
                yield redisClient_1.redis.hset(`user:${userId}`, "currentRoom", roomId);
                console.log(`[chatHandler] Updated Redis: user:${userId} -> currentRoom: ${roomId}`);
            }
            catch (err) {
                console.error("[chatHandler] Redis error storing room:", err);
            }
        }
        // Notify the room that someone joined (optional)
        socket.to(roomId).emit("chat:system", {
            text: `${username} joined the chat`,
            roomId,
        });
        console.log(`[chatHandler] User ${userId} successfully joined room ${roomId}`);
    });
}
/**
 * When a user emits "chat:send", broadcast it to everyone in the room.
 * Pass io instance to properly broadcast to ALL including sender.
 */
function handleChatSend(io, socket, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const { roomId, text } = payload;
        const userId = socket.data.userId;
        const username = socket.data.username || userId;
        if (!(text === null || text === void 0 ? void 0 : text.trim())) {
            console.warn("[chatHandler] chat:send with empty text");
            return;
        }
        // Use roomId from payload, or fall back to socket.data
        const targetRoom = roomId || socket.data.currentRoomId;
        if (!targetRoom) {
            console.error("[chatHandler] chat:send without roomId", { userId, text });
            socket.emit("chat:error", { error: "No room specified" });
            return;
        }
        console.log(`[chatHandler] chat:send from ${userId} (${username}) in room ${targetRoom}: "${text}"`);
        const message = {
            from: userId,
            text: text.trim(),
            ts: Date.now(),
            roomId: targetRoom,
        };
        // CRITICAL: Use io.to(room) to broadcast to ALL sockets in room (including sender)
        // This is the key difference: io.to() includes sender, socket.to() doesn't
        io.to(targetRoom).emit("chat:message", message);
        console.log(`[chatHandler] Broadcasted message to ALL in room ${targetRoom} (including sender)`);
    });
}
/**
 * Optional: Handle user leaving a chat room
 */
function handleChatRoomLeave(socket, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const { roomId } = payload;
        const userId = socket.data.userId;
        const username = socket.data.username || userId;
        if (!roomId)
            return;
        console.log(`[chatHandler] User ${userId} leaving room: ${roomId}`);
        socket.leave(roomId);
        socket.data.currentRoomId = null;
        if (userId) {
            try {
                yield redisClient_1.redis.hdel(`user:${userId}`, "currentRoom");
            }
            catch (err) {
                console.error("[chatHandler] Redis error removing room:", err);
            }
        }
        // Notify others in the room
        socket.to(roomId).emit("chat:system", {
            text: `${username} left the chat`,
            roomId,
        });
    });
}
