/**
 * Rate Limiter
 *
 * Ported from frontend/lib/rate-limit.ts — no framework-specific code.
 *
 * Changes from Next.js version:
 *   - Removed setInterval cleanup (not suitable for edge/serverless)
 *   - Lazy cleanup on each check instead
 *   - TODO: For Cloudflare Workers at scale, use KV or Durable Objects
 */

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Max requests per interval
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// In-memory store — works for single-instance or low-traffic
const rateLimitStore = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();

function lazyCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return; // Clean at most every minute
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  lazyCleanup();
  const now = Date.now();

  let entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    entry = { count: 1, resetTime: now + config.interval };
    rateLimitStore.set(identifier, entry);
    return { success: true, remaining: config.maxRequests - 1, reset: entry.resetTime };
  }

  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      reset: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  entry.count++;
  rateLimitStore.set(identifier, entry);
  return { success: true, remaining: config.maxRequests - entry.count, reset: entry.resetTime };
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Cloudflare Workers provide CF-Connecting-IP
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

/**
 * Pre-configured rate limits for different route types
 */
export const RATE_LIMITS = {
  auth: { interval: 15 * 60 * 1000, maxRequests: 10 },
  api: { interval: 60 * 1000, maxRequests: 60 },
  ai: { interval: 60 * 1000, maxRequests: 10 },
  search: { interval: 60 * 1000, maxRequests: 30 },
  symbolic: { interval: 60 * 1000, maxRequests: 15 },
  verification: { interval: 60 * 60 * 1000, maxRequests: 3 },
} as const;

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };
  if (!result.success && result.retryAfter) {
    headers["Retry-After"] = String(result.retryAfter);
  }
  return headers;
}

/**
 * Higher-order function to wrap API route handlers with rate limiting
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  config: RateLimitConfig = RATE_LIMITS.api,
  keyPrefix: string = "api"
) {
  return async (request: Request): Promise<Response> => {
    const identifier = getClientIdentifier(request);
    const key = `${keyPrefix}:${identifier}`;
    const result = checkRateLimit(key, config);
    const headers = createRateLimitHeaders(result);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...headers } }
      );
    }

    const response = await handler(request);
    const newHeaders = new Headers(response.headers);
    Object.entries(headers).forEach(([k, v]) => newHeaders.set(k, v));
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}
