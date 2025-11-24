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
const ioredis_1 = __importDefault(require("ioredis"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const STREAM_KEY = process.env.STREAM_KEY || "stream:ended_rooms";
const GROUP = process.env.STREAM_GROUP || "ended_rooms_group";
const CONSUMER = process.env.STREAM_CONSUMER || (`worker-${Math.floor(Math.random() * 10000)}`);
const NEXT_FINALIZE_ENDPOINT = (process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000") + "/api/finalize-room";
const NEXT_SHARED_SECRET = process.env.NEXT_SHARED_SECRET || "change_me_now";
const BATCH = Number(process.env.STREAM_BATCH || 10);
const BLOCK_MS = Number(process.env.STREAM_BLOCK_MS || 2000);
const MAX_RETRIES = Number(process.env.STREAM_MAX_RETRIES || 5); // deliveries > MAX_RETRIES => dead-letter
const INITIAL_BACKOFF_MS = Number(process.env.INITIAL_BACKOFF_MS || 5000);
const MAX_BACKOFF_MS = Number(process.env.MAX_BACKOFF_MS || 60000);
const DEAD_LIST = process.env.STREAM_DEAD_LIST || "persist:dead";
const TRIM_MAXLEN = Number(process.env.STREAM_TRIM_MAXLEN || 20000); // 0 to disable
const TRIM_POLICY = process.env.STREAM_TRIM_POLICY || "~"; // approximate trim
const HTTP_TIMEOUT_MS = Number(process.env.HTTP_TIMEOUT_MS || 8000);
const redis = new ioredis_1.default(REDIS_URL);
function parseEntry(entry) {
    var _a;
    // entry => [id, [field, value, ...]]
    if (!Array.isArray(entry) || entry.length < 2)
        return null;
    const id = entry[0];
    const fields = entry[1];
    const obj = {};
    for (let i = 0; i < fields.length; i += 2)
        obj[fields[i]] = fields[i + 1];
    const raw = (_a = obj["room"]) !== null && _a !== void 0 ? _a : obj["payload"];
    if (!raw)
        return { id, payload: undefined };
    try {
        return { id, payload: JSON.parse(raw) };
    }
    catch (_b) {
        return { id, payload: undefined };
    }
}
function ensureGroup() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            yield redis.xgroup("CREATE", STREAM_KEY, GROUP, "0", "MKSTREAM");
            console.log("[worker] consumer group created:", GROUP);
        }
        catch (err) {
            if ((_a = err === null || err === void 0 ? void 0 : err.message) === null || _a === void 0 ? void 0 : _a.includes("BUSYGROUP")) {
                console.log("[worker] consumer group exists:", GROUP);
            }
            else {
                throw err;
            }
        }
    });
}
function backoffFor(deliveries) {
    // deliveries is >=1; for first retry use INITIAL_BACKOFF_MS, then double up to MAX_BACKOFF_MS
    const pow = Math.max(0, deliveries - 1);
    return Math.min(INITIAL_BACKOFF_MS * Math.pow(2, pow), MAX_BACKOFF_MS);
}
function postToNext(payload, signal) {
    return __awaiter(this, void 0, void 0, function* () {
        const init = {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-shared-secret": NEXT_SHARED_SECRET,
            },
            body: JSON.stringify(payload),
            signal,
        };
        const res = yield (0, node_fetch_1.default)(NEXT_FINALIZE_ENDPOINT, init);
        const text = yield res.text();
        return { ok: res.ok, status: res.status, bodyText: text };
    });
}
function ackAndDelete(ids) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!ids.length)
            return;
        try {
            yield redis.xack(STREAM_KEY, GROUP, ...ids);
        }
        catch (e) {
            console.error("[worker] XACK error", e);
        }
        try {
            yield redis.xdel(STREAM_KEY, ...ids);
        }
        catch (e) {
            console.error("[worker] XDEL error", e);
        }
    });
}
function moveToDeadAndDelete(id, reason, extra) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield redis.lpush(DEAD_LIST, JSON.stringify(Object.assign({ id, reason, at: Date.now() }, extra)));
        }
        catch (e) {
            console.error("[worker] push to dead failed", e);
        }
        yield ackAndDelete([id]);
    });
}
function processFresh() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        // Read NEW messages only (">")
        const res = yield redis.xreadgroup("GROUP", GROUP, CONSUMER, "STREAMS", STREAM_KEY, ">", "COUNT", BATCH, "BLOCK", BLOCK_MS);
        if (!res)
            return;
        // res => [[streamKey, [[id, [f,v...]], ...]]]
        const entries = (res[0] && res[0][1]) || [];
        const successes = [];
        for (const entry of entries) {
            const parsed = parseEntry(entry);
            if (!parsed)
                continue;
            const id = parsed.id;
            if (!parsed.payload) {
                console.warn("[worker] malformed payload (fresh), id=", id);
                yield moveToDeadAndDelete(id, "malformed_payload");
                continue;
            }
            // POST to Next with timeout
            try {
                const controller = new AbortController();
                const t = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
                const { ok, status, bodyText } = yield postToNext(parsed.payload, controller.signal);
                clearTimeout(t);
                if (ok) {
                    successes.push(id);
                    console.log("[worker] persisted room", (_a = parsed.payload.roomId) !== null && _a !== void 0 ? _a : "(no-id)", "id=", id);
                }
                else if (status >= 400 && status < 500) {
                    console.warn("[worker] 4xx client error -> dead-letter", status, bodyText, "id=", id);
                    yield moveToDeadAndDelete(id, "http_4xx", { status, bodyText, payload: parsed.payload });
                }
                else {
                    // 5xx / unknown -> leave pending to retry later
                    console.error("[worker] 5xx server error, will retry later", status, bodyText, "id=", id);
                }
            }
            catch (err) {
                console.error("[worker] network/timeout, will retry later, id=", id, (_b = err === null || err === void 0 ? void 0 : err.message) !== null && _b !== void 0 ? _b : err);
            }
        }
        if (successes.length)
            yield ackAndDelete(successes);
    });
}
function processPendingWithBackoff() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        // Inspect pending summary (oldest first, up to BATCH)
        // XPENDING -> [[id, consumer, idle, deliveries], ...]
        const summary = yield redis.xpending(STREAM_KEY, GROUP, "-", "+", BATCH);
        if (!summary || !summary.length)
            return;
        const toClaim = [];
        const toDead = [];
        // decide which we should claim now (idle >= backoffFor(deliveries))
        for (const row of summary) {
            const id = row[0];
            const idle = Number(row[2] || 0);
            const deliveries = Number(row[3] || 0);
            if (deliveries > MAX_RETRIES) {
                toDead.push(id);
                continue;
            }
            const needIdle = backoffFor(deliveries);
            if (idle >= needIdle)
                toClaim.push(id);
        }
        // move over-retried to dead
        for (const id of toDead) {
            console.warn("[worker] moving to dead: too_many_deliveries id=", id);
            yield moveToDeadAndDelete(id, "too_many_deliveries");
        }
        if (!toClaim.length)
            return;
        // Claim entries to this consumer (JUSTID to get ids quickly)
        const claimedIds = (yield redis.xclaim(STREAM_KEY, GROUP, CONSUMER, Math.max(INITIAL_BACKOFF_MS, 1000), // min idle to claim
        ...toClaim, "JUSTID"));
        if (!claimedIds || !claimedIds.length)
            return;
        // Fetch the full entries by ID and process like fresh
        const first = claimedIds[0];
        const last = claimedIds[claimedIds.length - 1];
        const range = yield redis.xrange(STREAM_KEY, first, last);
        const byId = new Map();
        for (const e of range)
            byId.set(e[0], e);
        const successes = [];
        for (const id of claimedIds) {
            const entry = byId.get(id);
            if (!entry)
                continue;
            const parsed = parseEntry(entry);
            if (!parsed || !parsed.payload) {
                console.warn("[worker] malformed payload (pending), id=", id);
                yield moveToDeadAndDelete(id, "malformed_payload");
                continue;
            }
            try {
                const controller = new AbortController();
                const t = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
                const { ok, status, bodyText } = yield postToNext(parsed.payload, controller.signal);
                clearTimeout(t);
                if (ok) {
                    successes.push(id);
                    console.log("[worker] persisted (retry) room", (_a = parsed.payload.roomId) !== null && _a !== void 0 ? _a : "(no-id)", "id=", id);
                }
                else if (status >= 400 && status < 500) {
                    console.warn("[worker] 4xx client error (retry) -> dead-letter", status, bodyText, "id=", id);
                    yield moveToDeadAndDelete(id, "http_4xx", { status, bodyText, payload: parsed.payload });
                }
                else {
                    // leave pending for next backoff window
                    console.error("[worker] 5xx server error (retry), keep pending, id=", id, status, bodyText);
                }
            }
            catch (err) {
                console.error("[worker] network/timeout (retry), keep pending, id=", id, (_b = err === null || err === void 0 ? void 0 : err.message) !== null && _b !== void 0 ? _b : err);
            }
        }
        if (successes.length)
            yield ackAndDelete(successes);
    });
}
// -------------- main loop -----------------
function logPendingCounts() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const info = yield redis.xpending(STREAM_KEY, GROUP);
            // info => { count, min, max, consumers: [ {name, pending}, ... ] } in some clients;
            // ioredis returns an array variant sometimes; wrap defensively:
            if (Array.isArray(info)) {
                console.log("[worker] XPENDING summary:", info);
            }
            else {
                console.log("[worker] pending count:", info === null || info === void 0 ? void 0 : info.count, "consumers:", (_a = info === null || info === void 0 ? void 0 : info.consumers) === null || _a === void 0 ? void 0 : _a.length);
            }
        }
        catch (e) {
            console.error("[worker] XPENDING summary failed", e);
        }
    });
}
function maybeTrimStream() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!TRIM_MAXLEN || TRIM_MAXLEN <= 0)
            return;
        try {
            yield redis.xtrim(STREAM_KEY, "MAXLEN", TRIM_MAXLEN);
        }
        catch (e) {
            // not fatal
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield ensureGroup();
        // periodic health logs
        setInterval(() => {
            logPendingCounts().catch(() => { });
        }, 15000);
        while (true) {
            try {
                // 1) Process new messages quickly
                yield processFresh();
                // 2) Process pending (stuck) with exponential backoff policy
                yield processPendingWithBackoff();
                // 3) Optional trim
                yield maybeTrimStream();
            }
            catch (e) {
                console.error("[worker] loop error", e);
            }
            finally {
                // small idle to avoid busy-looping
                yield new Promise((r) => setTimeout(r, 300));
            }
        }
    });
}
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("[worker] shutting down...");
    try {
        yield redis.quit();
    }
    catch (_a) { }
    process.exit(0);
}));
main().catch((e) => {
    console.error("[worker] fatal on startup:", e);
    process.exit(1);
});
