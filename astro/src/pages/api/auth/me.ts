/**
 * GET /api/auth/me
 * Return the currently authenticated user from Directus.
 */
import type { APIRoute } from "astro";
import { getAuthedUser } from "@/lib/auth-server";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";

export const GET: APIRoute = async ({ request, locals }) => {
  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:me:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }), { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }

  try {
    // getAuthedUser does a two-step lookup: verify session token, then fetch
    // role/policies via the server's admin static token (most deployments
    // restrict directus_users self-read so a user can't see their own role).
    const user = await getAuthedUser(request, locals);
    return new Response(JSON.stringify({ user }), { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } });
  } catch (error) {
    console.error("Get user error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch user data" }), { status: 401, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }
};
