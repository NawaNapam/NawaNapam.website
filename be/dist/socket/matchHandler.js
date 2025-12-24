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
const MATCH_TIMEOUT_MS = 15000; // 15 seconds timeout for filtered searches
function handleMatchRequest(io, socket, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = socket.data.userId;
        const userGender = socket.data.gender; // User's actual gender
        if (!userId)
            return socket.emit("match:error", "not-authenticated");
        const genderPreference = ((payload === null || payload === void 0 ? void 0 : payload.pref) || "random").toLowerCase();
        const now = Date.now();
        try {
            const u = yield redisClient_1.redis.hgetall(`user:${userId}`);
            if (u && (u.status === "matched" || (u.currentRoom && u.currentRoom !== ""))) {
                console.warn("[match] user already in room", { userId, status: u.status });
                return socket.emit("match:error", "already-in-room");
            }
            // Mark user as available with their preference
            yield redisClient_1.redis.hset(`user:${userId}`, "status", "available", "lastSeen", String(now), "currentRoom", "", "gender", userGender, "genderPreference", genderPreference // Store what they're looking for
            );
            // Add to appropriate availability pool based on THEIR gender (not preference)
            const poolKey = getPoolKey(userGender);
            yield redisClient_1.redis.sadd(poolKey, userId);
            yield redisClient_1.redis.zadd(`${poolKey}_by_time`, now, userId);
            console.log(`[match] User ${userId} (gender: ${userGender}) looking for: ${genderPreference}`);
            // Call enhanced Lua script with preference
            const raw = yield redisClient_1.redis.evalsha(scripts_1.scripts.matchSha, 0, userId, String(now), String(STALE_MS), genderPreference, // ARGV[4]
            userGender // ARGV[5] - requester's actual gender
            );
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
                    const rid = parsed.roomId;
                    console.log("[match] ✅ MATCH SUCCESS", { userId, peerId, roomId: rid, filter: genderPreference });
                    // Update both users' status
                    yield Promise.all([
                        redisClient_1.redis.hset(`user:${userId}`, "status", "matched", "currentRoom", rid),
                        redisClient_1.redis.hset(`user:${peerId}`, "status", "matched", "currentRoom", rid),
                    ]);
                    // Get peer info
                    const peerHash = yield redisClient_1.redis.hgetall(`user:${peerId}`);
                    const peerUsername = peerHash.username || peerHash.name || peerId;
                    const peerSocketId = peerHash.socketId;
                    // Get requester info
                    const requesterHash = yield redisClient_1.redis.hgetall(`user:${userId}`);
                    const requesterUsername = requesterHash.username || requesterHash.name || userId;
                    // Emit to both users
                    socket.emit("match:found", {
                        peerId,
                        peerUsername,
                        roomId: rid
                    });
                    if (peerSocketId) {
                        io.to(peerSocketId).emit("match:found", {
                            peerId: userId,
                            peerUsername: requesterUsername,
                            roomId: rid
                        });
                    }
                    // Join both to room
                    yield (0, chatHandlers_1.handleChatRoomJoin)(io, socket, { roomId: rid });
                    if (peerSocketId) {
                        const peerSocket = io.sockets.sockets.get(peerSocketId);
                        if (peerSocket) {
                            yield (0, chatHandlers_1.handleChatRoomJoin)(io, peerSocket, { roomId: rid });
                        }
                    }
                    // Publish for cross-server
                    yield redisClient_1.pub.publish("pubsub:presence", `matched|${rid}|${userId}|${peerId}`);
                    return;
                }
                // Handle no match scenarios
                const errCode = String(parsed.err || "").toUpperCase();
                if (errCode === "NO_PEER" || errCode === "STALE_PEER" || errCode === "NOT_AVAILABLE") {
                    yield redisClient_1.redis.hset(`user:${userId}`, "status", "available", "lastSeen", String(Date.now()));
                    socket.emit("match:queued", { filter: genderPreference });
                    console.log("[match] 🕒 Queued", { userId, filter: genderPreference, reason: errCode });
                    // Set timeout for filtered searches
                    if (genderPreference !== "random") {
                        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                            const currentStatus = yield redisClient_1.redis.hget(`user:${userId}`, "status");
                            if (currentStatus === "available") {
                                socket.emit("match:timeout", {
                                    filter: genderPreference,
                                    message: `No ${genderPreference} users available right now. Try "Random" or wait.`
                                });
                            }
                        }), MATCH_TIMEOUT_MS);
                    }
                    return;
                }
                console.warn("[match] Script error", { userId, errCode });
                return socket.emit("match:error", errCode || "match_failed");
            }
            // Default: queue
            yield redisClient_1.redis.hset(`user:${userId}`, "status", "available", "lastSeen", String(Date.now()));
            socket.emit("match:queued", { filter: genderPreference });
        }
        catch (e) {
            console.error("[match] Error:", e, { userId });
            return socket.emit("match:error", String((e === null || e === void 0 ? void 0 : e.message) || e));
        }
    });
}
// Helper: Get pool key based on user's actual gender
function getPoolKey(gender) {
    const normalized = gender === null || gender === void 0 ? void 0 : gender.toLowerCase();
    if (normalized === "male")
        return "available:male";
    if (normalized === "female")
        return "available:female";
    return "available:random"; // Fallback for unspecified/other genders
}
