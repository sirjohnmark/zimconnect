/**
 * Rate limiting via Upstash Redis (sliding window algorithm).
 *
 * Limiters are lazily initialised on first use — Redis is never touched at
 * module load time so missing env vars do NOT break the build or dev server.
 *
 * If UPSTASH_REDIS_REST_URL / _TOKEN are absent (local dev without Redis),
 * every limit() call returns success:true so the app continues to work.
 *
 * Required env vars (server-only, never NEXT_PUBLIC_):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Internal lazy limiter wrapper
// ---------------------------------------------------------------------------

interface LimitResult {
  success: boolean;
  reset: number; // Unix ms
}

interface RateLimiter {
  limit(identifier: string): Promise<LimitResult>;
}

function defineLimiter(
  requests: number,
  window: `${number} ${"s" | "m" | "h" | "d"}`,
  prefix: string
): RateLimiter {
  let _instance: Ratelimit | null = null;

  return {
    limit(identifier: string): Promise<LimitResult> {
      // Graceful bypass when Redis is not configured (local dev / CI).
      const url   = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!url || !token) {
        return Promise.resolve({ success: true, reset: Date.now() + 60_000 });
      }

      if (!_instance) {
        _instance = new Ratelimit({
          redis: new Redis({ url, token }),
          limiter: Ratelimit.slidingWindow(requests, window),
          prefix,
          analytics: false,
        });
      }

      return _instance.limit(identifier);
    },
  };
}

// ---------------------------------------------------------------------------
// Named limiters (exported)
// ---------------------------------------------------------------------------

/** 5 signup attempts per IP per hour */
export const signupLimiter = defineLimiter(5, "1 h", "zc:rl:signup");

/** 10 listings created per user per hour */
export const listingCreateLimiter = defineLimiter(10, "1 h", "zc:rl:listing:create");

/** 30 messages per user per 10 minutes */
export const messageSendLimiter = defineLimiter(30, "10 m", "zc:rl:message:send");

/** 20 WhatsApp click-throughs per IP per minute */
export const whatsappClickLimiter = defineLimiter(20, "1 m", "zc:rl:whatsapp:click");

// ---------------------------------------------------------------------------
// RateLimitError
// ---------------------------------------------------------------------------

export class RateLimitError extends Error {
  public readonly reset: number; // Unix ms

  constructor(message: string, reset: number) {
    super(message);
    this.name = "RateLimitError";
    this.reset = reset;
  }
}

// ---------------------------------------------------------------------------
// Hash helper
// Identifiers (IPs, user IDs) are SHA-256 hashed before being used as Redis
// keys so no PII ever appears in plain text in the key store or logs.
// ---------------------------------------------------------------------------
async function hashIdentifier(identifier: string): Promise<string> {
  const encoded    = new TextEncoder().encode(identifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32); // 16 bytes — collision-resistant for rate-limit keys
}

// ---------------------------------------------------------------------------
// applyRateLimit
// ---------------------------------------------------------------------------
// Throws RateLimitError when the limit is exceeded.
// Callers must catch this and return { error: err.message } to the client.
//
// Example:
//   try {
//     await applyRateLimit(signupLimiter, clientIp);
//   } catch (err) {
//     if (err instanceof RateLimitError) return { error: err.message };
//     throw err;
//   }
// ---------------------------------------------------------------------------
export async function applyRateLimit(
  limiter: RateLimiter,
  identifier: string
): Promise<{ success: true; reset: number }> {
  const safeKey            = await hashIdentifier(identifier);
  const { success, reset } = await limiter.limit(safeKey);

  if (!success) {
    const msRemaining = Math.max(0, reset - Date.now());
    const minutes     = Math.ceil(msRemaining / 60_000);

    const message =
      minutes <= 1
        ? "Too many requests — please wait a moment and try again."
        : `Too many requests — please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;

    throw new RateLimitError(message, reset);
  }

  return { success: true, reset };
}

// ---------------------------------------------------------------------------
// getRequestIp
// ---------------------------------------------------------------------------
// Extract a best-effort client IP from Next.js request headers.
// Use this in Server Actions to key signup / click limiters on IP.
//
// Call from the action:
//   import { headers } from "next/headers";
//   const ip = getRequestIp(await headers());
// ---------------------------------------------------------------------------
export function getRequestIp(headersList: Headers): string {
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  );
}
