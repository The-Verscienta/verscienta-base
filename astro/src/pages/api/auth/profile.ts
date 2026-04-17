/**
 * PATCH /api/auth/profile
 * Update user profile via Directus.
 */
import type { APIRoute } from "astro";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";

export const PATCH: APIRoute = async ({ request }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:profile:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }), { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }

  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const tokenMatch = cookieHeader.match(/access_token=([^;]*)/);
    const accessToken = tokenMatch?.[1];

    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const body = await request.json();
    const { first_name, last_name, email, password } = body;

    // Build update payload for Directus
    const updateData: Record<string, unknown> = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (email) updateData.email = email;
    if (password) updateData.password = password;

    const updateResponse = await fetch(`${DIRECTUS_URL}/users/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: error?.errors?.[0]?.message || "Failed to update profile" }), { status: updateResponse.status, headers: { "Content-Type": "application/json", ...rlHeaders } });
    }

    const result = await updateResponse.json();
    return new Response(JSON.stringify({ success: true, user: result.data }), { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } });
  } catch (error: unknown) {
    console.error("Profile update error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Profile update failed" }), { status: 500, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }
};
