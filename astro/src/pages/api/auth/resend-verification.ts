/**
 * POST /api/auth/resend-verification
 * Asks the auth-resend-verify Directus extension to email a fresh
 * verification link to the current user.
 */
import type { APIRoute } from "astro";
import { checkRateLimit, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { getRequestAccessToken } from "@/lib/auth-server";

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";

export const POST: APIRoute = async ({ request, locals }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const accessToken = getRequestAccessToken(request, locals);
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Look up user to get id (for per-user rate limit) and verified status
  const meRes = await fetch(`${DIRECTUS_URL}/users/me?fields=id,email_verified`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meRes.ok) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const me = (await meRes.json())?.data;
  if (!me) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (me.email_verified) {
    return new Response(JSON.stringify({ error: "Email already verified" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Per-user rate limit (3 / hour)
  const rl = checkRateLimit(`verification:${me.id}`, RATE_LIMITS.verification);
  const rlHeaders = createRateLimitHeaders(rl);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const extRes = await fetch(`${DIRECTUS_URL}/auth-resend-verify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!extRes.ok) {
    const error = await extRes.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ error: error?.error || "Failed to send verification email" }),
      { status: extRes.status, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...rlHeaders },
  });
};
