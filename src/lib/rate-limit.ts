/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * State lives in the process memory, so it protects a single long-running
 * Node server (`next start`) well. On serverless / multi-instance deploys each
 * instance keeps its own counters — for a hard global limit there, back this
 * with Supabase (a `lag8_rate_limits` table) or Upstash Redis instead.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  /** Requests left in the current window. */
  remaining: number;
  /** Seconds until the window resets (0 when not limited). */
  retryAfter: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  // Opportunistic cleanup so expired buckets don't accumulate forever.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (now >= b.resetAt) buckets.delete(k);
    }
  }

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}
