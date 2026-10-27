interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const MAX_BUCKET_ENTRIES = 10000;
const ipBuckets = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit buckets every 2 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    ipBuckets.forEach((record, key) => {
      if (now > record.resetAt) {
        ipBuckets.delete(key);
      }
    });
  }, 120000);
}

export function checkRateLimit(
  ip: string,
  limit = 60,
  windowMs = 60000
): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const record = ipBuckets.get(ip);

  if (!record || now > record.resetAt) {
    if (ipBuckets.size >= MAX_BUCKET_ENTRIES && !ipBuckets.has(ip)) {
      // Evict expired entries first, or the oldest key if still at capacity
      ipBuckets.forEach((rec, key) => {
        if (now > rec.resetAt) {
          ipBuckets.delete(key);
        }
      });
      if (ipBuckets.size >= MAX_BUCKET_ENTRIES) {
        const firstKey = ipBuckets.keys().next().value;
        if (firstKey !== undefined) {
          ipBuckets.delete(firstKey);
        }
      }
    }
    ipBuckets.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetInSec: Math.ceil(windowMs / 1000) };
  }

  record.count += 1;
  const resetInSec = Math.ceil((record.resetAt - now) / 1000);

  if (record.count > limit) {
    return { allowed: false, remaining: 0, resetInSec };
  }

  return { allowed: true, remaining: limit - record.count, resetInSec };
}
