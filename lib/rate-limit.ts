/**
 * Simple in-memory rate limiter for API routes.
 * Tracks request counts per IP within a sliding window.
 */

const windowMs = 60_000; // 1 minute
const maxRequests = 15; // max requests per window per IP

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Periodically clean expired entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key);
  }
}, 60_000);

export function rateLimit(request: Request): { limited: boolean; remaining: number } {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();

  let entry = store.get(ip);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(ip, entry);
  }

  entry.count += 1;

  return {
    limited: entry.count > maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
  };
}
