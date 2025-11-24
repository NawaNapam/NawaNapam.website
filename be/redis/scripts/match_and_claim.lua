-- match_and_claim_global.lua (custom roomId format)
-- ARGV:
-- 1 = requesterId
-- 2 = nowTs (ms)
-- 3 = staleThresholdMs

local requester = ARGV[1]
local now = tonumber(ARGV[2])
local stale = tonumber(ARGV[3])

local function ret(tbl) return cjson.encode(tbl) end
if not requester or requester == "" then
  return ret({ ok = false, err = "MISSING_REQUESTER" })
end

if not now then now = tonumber(redis.call("TIME")[1]) * 1000 end
if not stale or stale <= 0 then stale = 30000 end

-- touch requester
redis.call("HSET", "user:"..requester, "lastSeen", tostring(now))

-- avoid self-pop
local removed = redis.call("SREM", "available", requester)

-- pop a candidate
local candidate = redis.call("SPOP", "available")

-- restore requester
if removed == 1 then
  redis.call("SADD", "available", requester)
end

if not candidate then
  return ret({ ok = false, err = "NO_PEER" })
end

-- validate candidate
local hash = redis.call("HGETALL", "user:" .. candidate)
if not hash or #hash == 0 then
  redis.call("SADD", "available", candidate)
  return ret({ ok = false, err = "STALE_PEER" })
end

local map = {}
for i = 1, #hash, 2 do map[hash[i]] = hash[i+1] end

if map["status"] ~= "available" then
  redis.call("SADD", "available", candidate)
  return ret({ ok = false, err = "NOT_AVAILABLE" })
end

local lastSeen = tonumber(map["lastSeen"] or "0")
if (now - lastSeen) > stale then
  redis.call("SADD", "available", candidate)
  return ret({ ok = false, err = "STALE_PEER" })
end

-- ✅ generate roomId as requester-now-candidate
local roomId = requester .. "-" .. tostring(now) .. "-" .. candidate

-- commit match
redis.call("HSET", "user:" .. candidate,
  "status","matched","with",requester,"currentRoom",roomId)
redis.call("HSET", "user:" .. requester,
  "status","matched","with",candidate,"currentRoom",roomId)

-- remove both from pools
redis.call("SREM", "available", candidate)
redis.call("SREM", "available", requester)
redis.call("ZREM", "available_by_time", candidate)
redis.call("ZREM", "available_by_time", requester)

-- create room
redis.call("HSET", "room:" .. roomId,
  "participants", requester .. "," .. candidate,
  "startedAt", tostring(now),
  "state", "active")
redis.call("SADD", "rooms:active", roomId)
redis.call("EXPIRE", "room:" .. roomId, 7200)

-- publish event for pubsub
redis.call("PUBLISH", "pubsub:presence", "matched|" .. roomId .. "|" .. requester .. "|" .. candidate)

return ret({ ok = true, candidate = candidate, roomId = roomId })
