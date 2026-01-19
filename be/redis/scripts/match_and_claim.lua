-- match_and_claim_with_filter.lua
-- ARGV:
-- 1 = requesterId
-- 2 = nowTs (ms)
-- 3 = staleThresholdMs
-- 4 = requesterPref ("random", "male", "female")
-- 5 = requesterGender

local requester = ARGV[1]
local now = tonumber(ARGV[2])
local stale = tonumber(ARGV[3])
local requesterPref = ARGV[4] or "random"
local requesterGender = ARGV[5] or ""

local function ret(tbl) return cjson.encode(tbl) end

if not requester or requester == "" then
  return ret({ ok=false, err="MISSING_REQUESTER" })
end

if not now then now = tonumber(redis.call("TIME")[1]) * 1000 end
if not stale or stale <= 0 then stale = 30000 end

-- touch requester
redis.call("HSET", "user:"..requester, "lastSeen", tostring(now))

-- Normalize preference
requesterPref = string.lower(requesterPref)

-- DEBUG: Log requester info
redis.log(redis.LOG_WARNING, string.format("[LUA] Requester %s (gender: %s, wants: %s)", 
  requester, requesterGender, requesterPref))

-- pools based on requester's preference
local pools = {}
if requesterPref == "random" then
  pools = { "available:male", "available:female", "available:random" }
else
  pools = { "available:" .. requesterPref }
end

-- util to check preference compatibility
local function accepts(pref, gender)
  local normalized_pref = string.lower(pref or "")
  local normalized_gender = string.lower(gender or "")
  return (normalized_pref == "random" or normalized_pref == "" or normalized_pref == normalized_gender)
end

local tried = {}
local candidate = nil
local candidatePool = nil

-- search candidates
for _, pool in ipairs(pools) do
  redis.call("SREM", pool, requester)
  local members = redis.call("SMEMBERS", pool)
  
  redis.log(redis.LOG_WARNING, string.format("[LUA] Checking pool %s, found %d members", pool, #members))

  for _, cand in ipairs(members) do
    if cand ~= requester and not tried[cand] then
      local hash = redis.call("HGETALL", "user:" .. cand)

      if hash and #hash > 0 then
        local map = {}
        for i = 1, #hash, 2 do map[hash[i]] = hash[i+1] end

        local status = map["status"]
        local lastSeen = tonumber(map["lastSeen"] or "0")
        local candGender = string.lower(map["gender"] or "random")
        local candPref = string.lower(map["prefGender"] or "random")

        -- DEBUG: Log candidate info
        redis.log(redis.LOG_WARNING, string.format("[LUA] Candidate %s: status=%s, gender=%s, wants=%s", 
          cand, status, candGender, candPref))

        if status ~= "available" or (now - lastSeen) > stale then
          redis.log(redis.LOG_WARNING, string.format("[LUA] Candidate %s rejected: status=%s or stale", cand, status))
          tried[cand] = true
        else
          -- Check bidirectional compatibility
          local ok1 = accepts(requesterPref, candGender)  -- Does requester accept candidate's gender?
          local ok2 = accepts(candPref, requesterGender)  -- Does candidate accept requester's gender?

          redis.log(redis.LOG_WARNING, string.format("[LUA] Compatibility check: requester wants %s, cand is %s = %s | cand wants %s, requester is %s = %s", 
            requesterPref, candGender, tostring(ok1), candPref, requesterGender, tostring(ok2)))

          if ok1 and ok2 then
            candidate = cand
            candidatePool = pool
            redis.log(redis.LOG_WARNING, string.format("[LUA] ✅ MATCH FOUND: %s <-> %s", requester, candidate))
            break
          else
            redis.log(redis.LOG_WARNING, string.format("[LUA] ❌ PREF_MISMATCH: %s <-> %s", requester, cand))
            tried[cand] = true
          end
        end
      end
    end
  end

  if candidate then break end
end

-- restore requester to real pool
local requesterPool = "available:random"
if string.lower(requesterGender) == "male" then 
  requesterPool = "available:male"
elseif string.lower(requesterGender) == "female" then 
  requesterPool = "available:female" 
end

redis.call("SADD", requesterPool, requester)
redis.log(redis.LOG_WARNING, string.format("[LUA] Restored %s to pool %s", requester, requesterPool))

if not candidate then
  redis.log(redis.LOG_WARNING, string.format("[LUA] NO_PEER for %s", requester))
  return ret({ ok=false, err="NO_PEER" })
end

-- MATCH CONFIRMED
local roomId = requester .. "-" .. tostring(now) .. "-" .. candidate

redis.call("HSET", "user:"..candidate,
  "status","matched","with",requester,"currentRoom",roomId)

redis.call("HSET", "user:"..requester,
  "status","matched","with",candidate,"currentRoom",roomId)

local allPools = {"available:male","available:female","available:random"}
for _, p in ipairs(allPools) do
  redis.call("SREM", p, requester)
  redis.call("SREM", p, candidate)
  redis.call("ZREM", p.."_by_time", requester)
  redis.call("ZREM", p.."_by_time", candidate)
end

redis.call("HSET", "room:"..roomId,
  "participants", requester .. "," .. candidate,
  "startedAt", tostring(now),
  "state", "active")

redis.call("SADD", "rooms:active", roomId)
redis.call("EXPIRE", "room:"..roomId, 7200)

redis.call("PUBLISH", "pubsub:presence",
  "matched|" .. roomId .. "|" .. requester .. "|" .. candidate)

redis.log(redis.LOG_WARNING, string.format("[LUA] Match complete: roomId=%s", roomId))

return ret({ ok=true, candidate=candidate, roomId=roomId })