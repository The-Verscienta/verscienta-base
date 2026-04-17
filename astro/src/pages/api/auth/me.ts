/**
 * GET /api/auth/me
 * Return the currently authenticated user from Directus.
 */
import type { APIRoute } from "astro";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";

export const GET: APIRoute = async ({ request }) => {
  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:me:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }), { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }

  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const tokenMatch = cookieHeader.match(/access_token=([^;]*)/);
    const accessToken = tokenMatch?.[1];

    if (!accessToken) {
      return new Response(JSON.stringify({ user: null }), { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } });
    }

    const user = await getCurrentUser(accessToken);
    return new Response(JSON.stringify({ user }), { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } });
  } catch (error) {
    console.error("Get user error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch user data" }), { status: 401, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }
};
