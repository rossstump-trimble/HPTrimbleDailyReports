interface RateLimitRecord {
  count: number;
  resetAt: number;
}

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
