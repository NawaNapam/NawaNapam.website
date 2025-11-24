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
exports.handleEndRoom = handleEndRoom;
const redisClient_1 = require("../utils/redis/redisClient");
const scripts_1 = require("../utils/redis/scripts");
function handleEndRoom(io, socket, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const roomId = payload === null || payload === void 0 ? void 0 : payload.roomId;
        if (!roomId)
            return socket.emit("end:error", "roomId required");
        try {
            // finalize room in Redis (publishes 'ended|roomId' on your pubsub)
            const raw = yield redisClient_1.redis.evalsha(scripts_1.scripts.finalizeSha, 0, roomId, String(Date.now()));
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            if (!parsed || !parsed.ok) {
                const errMsg = (parsed === null || parsed === void 0 ? void 0 : parsed.err) || "no-room";
                return socket.emit("end:error", errMsg);
            }
            // 1) Confirm to the caller
            socket.emit("end:ok", {
                roomId: parsed.roomId,
                participants: parsed.participants || [],
                partsMeta: parsed.partsMeta || {},
                startedAt: (_a = parsed.startedAt) !== null && _a !== void 0 ? _a : null,
                finalizedAt: (_b = parsed.finalizedAt) !== null && _b !== void 0 ? _b : null,
                state: (_c = parsed.state) !== null && _c !== void 0 ? _c : null,
            });
            // 2) Broadcast system message to both peers immediately (don’t wait on pubsub)
            io.to(roomId).emit("chat:system", { text: "Chat ended" });
            // 3) (Optional) force leave locally to prevent further messages
            io.in(roomId).socketsLeave(roomId);
        }
        catch (err) {
            console.error("finalize error", err);
            try {
                yield redisClient_1.redis.lpush("persist:retry", JSON.stringify({
                    roomId,
                    error: String((_d = err === null || err === void 0 ? void 0 : err.message) !== null && _d !== void 0 ? _d : err),
                    at: Date.now(),
                }));
            }
            catch (pushErr) {
                console.error("failed to push persist:retry", pushErr);
            }
            socket.emit("end:error", String((_e = err === null || err === void 0 ? void 0 : err.message) !== null && _e !== void 0 ? _e : err));
        }
    });
}
