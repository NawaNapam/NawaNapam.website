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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pub = exports.sub = exports.redis = void 0;
exports.safeEvalSha = safeEvalSha;
const ioredis_1 = __importDefault(require("ioredis"));
function makeClient(label) {
    const url = process.env.REDIS_URL;
    if (url) {
        const client = new ioredis_1.default(url, {
            // good production defaults
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,
            tls: url.startsWith("rediss://")
                ? { servername: new URL(url).hostname }
                : undefined,
        });
        client.on("error", (e) => console.error(`[redis:${label}]`, e.message));
        return client;
    }
    // Otherwise build from discrete env vars
    const host = process.env.REDIS_HOST;
    const port = Number(process.env.REDIS_PORT);
    const username = process.env.REDIS_USERNAME;
    const password = process.env.REDIS_PASSWORD;
    const useTLS = process.env.REDIS_TLS === "true";
    const opts = Object.assign({ host,
        port,
        username,
        password, enableReadyCheck: true, maxRetriesPerRequest: 3 }, (useTLS ? { tls: { servername: host } } : {}));
    const client = new ioredis_1.default();
    client.on("error", (e) => console.error(`[redis:${label}]`, e.message));
    return client;
}
exports.redis = makeClient("main");
exports.sub = makeClient("sub");
exports.pub = makeClient("pub");
function safeEvalSha(sha, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        return exports.redis.evalsha(sha, 0, ...args);
    });
}
