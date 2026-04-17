/**
 * GET /api/auth/verify-email?token=xxx
 * Verify email via Directus email verification flow.
 */
import type { APIRoute } from "astro";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";

export const GET: APIRoute = async ({ request, url }) => {
  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:verify:${identifier}`, RATE_LIMITS.auth);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }), { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }

  try {
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing verification token." }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // Directus handles email verification via its own flow
    // This endpoint proxies the verification request
    const response = await fetch(`${DIRECTUS_URL}/users/register/verify-email?token=${token}`, {
      method: "GET",
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Email verification failed. The link may have expired." }),
        { status: 400, headers: { "Content-Type": "application/json", ...rlHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email verified successfully. You can now log in." }),
      { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return new Response(JSON.stringify({ error: "Verification failed." }), { status: 500, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }
};
