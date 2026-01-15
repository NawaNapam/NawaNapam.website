-- match_and_claim_with_filter.lua
-- ARGV:
-- 1 = requesterId
-- 2 = nowTs (ms)
-- 3 = staleThresholdMs
-- 4 = genderPreference ("random", "male", "female")
-- 5 = requesterGender (user's actual gender)

local requester = ARGV[1]
local now = tonumber(ARGV[2])
local stale = tonumber(ARGV[3])
local preference = ARGV[4] or "random"
local requesterGender = ARGV[5] or ""

local function ret(tbl) return cjson.encode(tbl) end

if not requester or requester == "" then
  return ret({ ok = false, err = "MISSING_REQUESTER" })
end

if not now then now = tonumber(redis.call("TIME")[1]) * 1000 end
if not stale or stale <= 0 then stale = 30000 end

-- Touch requester
redis.call("HSET", "user:"..requester, "lastSeen", tostring(now))

-- Determine which pools to search based on requester preference
local poolsToSearch = {}
if preference == "random" then
  table.insert(poolsToSearch, "available:male")
  table.insert(poolsToSearch, "available:female")
  table.insert(poolsToSearch, "available:random")
elseif preference == "male" then
  table.insert(poolsToSearch, "available:male")
elseif preference == "female" then
  table.insert(poolsToSearch, "available:female")
else
  table.insert(poolsToSearch, "available:male")
  table.insert(poolsToSearch, "available:female")
  table.insert(poolsToSearch, "available:random")
end

-- Try to find a candidate
local candidate = nil
local candidatePool = nil

for _, pool in ipairs(poolsToSearch) do
  redis.call("SREM", pool, requester)
  local temp = redis.call("SPOP", pool)
  if temp and temp ~= requester then
    candidate = temp
    candidatePool = pool
    break
  end
end

-- Restore requester to correct pool
local requesterPool = "available:random"
if requesterGender == "male" then requesterPool = "available:male"
elseif requesterGender == "female" then requesterPool = "available:female" end
redis.call("SADD", requesterPool, requester)

-- No candidate found
if not candidate then
  return ret({ ok = false, err = "NO_PEER" })
end

-- Fetch candidate data
local hash = redis.call("HGETALL", "user:" .. candidate)
if not hash or #hash == 0 then
  if candidatePool then redis.call("SADD", candidatePool, candidate) end
  return ret({ ok = false, err = "STALE_PEER" })
end

local map = {}
for i = 1, #hash, 2 do map[hash[i]] = hash[i+1] end

-- Basic candidate validation
local candidateStatus = map["status"] or ""
local candidateLastSeen = tonumber(map["lastSeen"] or "0")
local candidateGender = map["gender"] or "random"
local candidatePref = map["prefGender"] or "random"

if candidateStatus ~= "available" then
  if candidatePool then redis.call("SADD", candidatePool, candidate) end
  return ret({ ok = false, err = "NOT_AVAILABLE" })
end

if (now - candidateLastSeen) > stale then
  if candidatePool then redis.call("SADD", candidatePool, candidate) end
  return ret({ ok = false, err = "STALE_PEER" })
end

-- Mutual preference check
local function accepts(pref, gender)
  if not pref or pref == "" or pref == "random" then
    return true
  end
  return pref == gender
end

local requesterAccepts = accepts(preference, candidateGender)
local candidateAccepts = accepts(candidatePref, requesterGender)

if not requesterAccepts or not candidateAccepts then
  -- candidate rejected → restore to pool
  if candidatePool then redis.call("SADD", candidatePool, candidate) end
  return ret({ ok = false, err = "PREF_MISMATCH" })
end

-- VALID MATCH
local roomId = requester .. "-" .. tostring(now) .. "-" .. candidate

redis.call("HSET", "user:" .. candidate,
  "status","matched","with",requester,"currentRoom",roomId)
redis.call("HSET", "user:" .. requester,
  "status","matched","with",candidate,"currentRoom",roomId)

-- Remove both from all pools
local allPools = {"available:male", "available:female", "available:random"}
for _, pool in ipairs(allPools) do
  redis.call("SREM", pool, candidate)
  redis.call("SREM", pool, requester)
  redis.call("ZREM", pool .. "_by_time", candidate)
  redis.call("ZREM", pool .. "_by_time", requester)
end

-- Create room entry
redis.call("HSET", "room:" .. roomId,
  "participants", requester .. "," .. candidate,
  "startedAt", tostring(now),
  "state", "active")
redis.call("SADD", "rooms:active", roomId)
redis.call("EXPIRE", "room:" .. roomId, 7200)

-- Publish match event for cross-server communication
redis.call("PUBLISH",
  "pubsub:presence",
  "matched|" .. roomId .. "|" .. requester .. "|" .. candidate)

return ret({ ok = true, candidate = candidate, roomId = roomId })
