import "server-only";
import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };

/**
 * In-memory fixed-window limiter. Good enough pre-scale: it resets whenever a
 * serverless instance recycles, so it's a throttle on casual brute-forcing,
 * not a hard guarantee across every instance. Revisit with a shared store
 * (e.g. Redis) if abuse patterns show that gap is actually being exploited.
 */
const buckets = new Map<string, Bucket>();

export function isRateLimited(key: string, { limit, windowMs }: { limit: number; windowMs: number }): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

/** Best-effort client identifier for rate-limiting unauthenticated entry points.
 *  Falls back to a shared key (e.g. local dev without a proxy) rather than
 *  throwing — a coarser limit is better than no limit. */
export async function clientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}
