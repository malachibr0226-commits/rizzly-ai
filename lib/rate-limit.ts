/**
 * In-memory rate limiter for API routes.
 * Tracks request counts per key within a sliding window.
 *
 * IP extraction only trusts the rightmost IP from x-forwarded-for so a
 * spoofed leading entry injected by a client cannot bypass limits.
 */

interface Entry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  /** Window length in milliseconds. Default 60 000 (1 minute). */
  windowMs?: number;
  /** Maximum requests allowed per window per key. Default 15. */
  max?: number;
}

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX = 15;

const store = new Map<string, Entry>();

// Periodically clean expired entries to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key);
  }
}, 60_000);

function extractIp(request: Request): string {
  // x-forwarded-for can contain a spoofed leading entry from untrusted clients.
  // Vercel sets exactly the REAL client IP as the last entry, so take the
  // rightmost value which cannot be forged by the caller.
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    const parts = forwarded.split(",");
    const rightmost = parts[parts.length - 1]?.trim();

    if (rightmost) {
      return rightmost;
    }
  }

  // Vercel also sets x-real-ip as the real client address.
  const realIp = request.headers.get("x-real-ip")?.trim();

  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export function rateLimit(
  request: Request,
  options?: RateLimitOptions,
): { limited: boolean; remaining: number; retryAfterMs: number } {
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const max = options?.max ?? DEFAULT_MAX;
  const ip = extractIp(request);
  const key = `${ip}`;
  const now = Date.now();

  let entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count += 1;
  const limited = entry.count > max;
  const remaining = Math.max(0, max - entry.count);
  const retryAfterMs = limited ? Math.max(0, entry.resetAt - now) : 0;

  return { limited, remaining, retryAfterMs };
}
