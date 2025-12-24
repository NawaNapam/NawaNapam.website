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
exports.handleAuth = handleAuth;
const redisClient_1 = require("../utils/redis/redisClient");
function handleAuth(socket, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, username, gender } = payload || {};
        if (!userId) {
            socket.emit("auth:error", "userId required");
            return;
        }
        socket.data.userId = userId;
        socket.data.username = username !== null && username !== void 0 ? username : "";
        socket.data.gender = gender !== null && gender !== void 0 ? gender : ""; // Store user's actual gender
        const now = Date.now();
        yield redisClient_1.redis.hset(`user:${userId}`, {
            status: "available",
            socketId: socket.id,
            lastSeen: String(now),
            username: username !== null && username !== void 0 ? username : "",
            gender: gender !== null && gender !== void 0 ? gender : "", // Persist gender in Redis
            currentRoom: ""
        });
        // presence TTL
        yield redisClient_1.redis.expire(`user:${userId}`, 30);
        socket.emit("auth:ok");
        console.log(`[auth] User ${userId} authenticated with gender: ${gender}`);
    });
}
