/**
 * POST /api/auth/logout
 * Clear auth cookies and revoke refresh token via Directus.
 */
import type { APIRoute } from "astro";
import { logoutUser } from "@/lib/auth";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";

export const POST: APIRoute = async ({ request }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:logout:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }), { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }

  try {
    // Try to revoke the refresh token server-side
    const cookieHeader = request.headers.get("cookie") || "";
    const refreshMatch = cookieHeader.match(/refresh_token=([^;]*)/);
    if (refreshMatch?.[1]) {
      await logoutUser(refreshMatch[1]);
    }

    const headers = new Headers({ "Content-Type": "application/json", ...rlHeaders });
    // Clear cookies by setting Max-Age=0
    headers.append("Set-Cookie", "access_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0");
    headers.append("Set-Cookie", "refresh_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0");

    return new Response(JSON.stringify({ success: true, message: "Logged out successfully" }), { status: 200, headers });
  } catch (error) {
    console.error("Logout error:", error);
    return new Response(JSON.stringify({ error: "Logout failed" }), { status: 500, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }
};
