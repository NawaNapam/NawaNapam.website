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
exports.handleMatchRequest = handleMatchRequest;
const redisClient_1 = require("../utils/redis/redisClient");
const scripts_1 = require("../utils/redis/scripts");
const chatHandlers_1 = require("./chatHandlers");
const STALE_MS = Number(process.env.STALE_MS || 30000);
function handleMatchRequest(io, socket) {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = socket.data.userId;
        if (!userId)
            return socket.emit("match:error", "not-authenticated");
        const now = Date.now();
        try {
            const u = yield redisClient_1.redis.hgetall(`user:${userId}`);
            if (u && (u.status === "matched" || (u.currentRoom && u.currentRoom !== ""))) {
                console.warn("[match] user already in room", { userId, status: u.status, currentRoom: u.currentRoom });
                return socket.emit("match:error", "already-in-room");
            }
            // ✅ Mark user as available in their hash too (and refresh lastSeen, clear any stale currentRoom)
            yield redisClient_1.redis.hset(`user:${userId}`, "status", "available", "lastSeen", String(now), "currentRoom", "");
            // Ensure requester is visible in pools
            yield redisClient_1.redis.sadd("available", userId);
            yield redisClient_1.redis.zadd("available_by_time", now, userId);
            // Lua decides the peer and generates the canonical roomId (requester-now-candidate)
            const raw = yield redisClient_1.redis.evalsha(scripts_1.scripts.matchSha, 0, userId, String(now), String(STALE_MS));
            let parsed = null;
            if (typeof raw === "string" && raw.startsWith("{")) {
                try {
                    parsed = JSON.parse(raw);
                }
                catch (_a) { }
            }
            else if (raw && typeof raw === "object") {
                parsed = raw;
            }
            if (parsed) {
                if (parsed.ok) {
                    const peerId = parsed.candidate;
                    const rid = parsed.roomId; // authoritative
                    // requester is matched now
                    yield redisClient_1.redis.hset(`user:${userId}`, "status", "matched", "currentRoom", rid);
                    socket.emit("match:found", { peerId, roomId: rid });
                    // server-join requester immediately
                    yield (0, chatHandlers_1.handleChatRoomJoin)(io, socket, { roomId: rid });
                    console.log("[match] requester joined room", { userId, roomId: rid, peerId });
                    return;
                }
                const errCode = String(parsed.err || "").toUpperCase();
                if (errCode === "NO_PEER" || errCode === "STALE_PEER" || errCode === "NOT_AVAILABLE") {
                    // keep them available while queued
                    yield redisClient_1.redis.hset(`user:${userId}`, "status", "available", "lastSeen", String(Date.now()));
                    socket.emit("match:queued");
                    console.log("[match] queued", { userId });
                    return;
                }
                console.warn("[match] error from script", { userId, errCode, raw: parsed });
                return socket.emit("match:error", errCode || "match_failed");
            }
            // Default graceful path: queue
            yield redisClient_1.redis.hset(`user:${userId}`, "status", "available", "lastSeen", String(Date.now()));
            socket.emit("match:queued");
            console.log("[match] queued (default path)", { userId });
            return;
        }
        catch (e) {
            const msg = String((e === null || e === void 0 ? void 0 : e.message) || e);
            if (msg.includes("NO_PEER")) {
                yield redisClient_1.redis.hset(`user:${userId}`, "status", "available", "lastSeen", String(Date.now()));
                socket.emit("match:queued");
                console.log("[match] queued via NO_PEER", { userId });
                return;
            }
            console.error("[match] error", e, { userId });
            return socket.emit("match:error", msg);
        }
    });
}
