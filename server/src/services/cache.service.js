const NodeCache = require("node-cache");

// checkperiod: how often expired keys are swept, in seconds — doesn't affect
// TTL correctness, just memory cleanup cadence.
const cache = new NodeCache({ stdTTL: 0, checkperiod: 120 });

const TTL = {
  MINUTES: (n) => n * 60,
  HOURS: (n) => n * 60 * 60,
  DAYS: (n) => n * 60 * 60 * 24,
};

// Returns the cached value for `key` if present; otherwise calls `fetchFn`,
// caches the result for `ttlSeconds`, and returns it. `fetchFn` is only
// invoked on a cache miss, so it's safe to put expensive work (TMDB call +
// Mongo upsert) inside it.
async function getOrSet(key, ttlSeconds, fetchFn) {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const value = await fetchFn();
  cache.set(key, value, ttlSeconds);
  return value;
}

function del(key) {
  cache.del(key);
}

function flush() {
  cache.flushAll();
}

module.exports = { getOrSet, del, flush, TTL };
