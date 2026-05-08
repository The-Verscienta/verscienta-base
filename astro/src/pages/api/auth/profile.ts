/**
 * PATCH /api/auth/profile
 * Update user profile via Directus. Email and password changes require
 * `current_password` to defend against stolen-session attacks.
 */
import type { APIRoute } from "astro";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { getRequestAccessToken } from "@/lib/auth-server";

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";

export const PATCH: APIRoute = async ({ request, locals }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:profile:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(
      JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }),
      { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }

  try {
    const accessToken = getRequestAccessToken(request, locals);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...rlHeaders },
      });
    }

    const body = await request.json();
    const { first_name, last_name, email, password, current_password } = body;

    const requiresPassword = email !== undefined || password !== undefined;
    if (requiresPassword && (typeof current_password !== "string" || current_password.length === 0)) {
      return new Response(
        JSON.stringify({ error: "current_password required to change email or password." }),
        { status: 400, headers: { "Content-Type": "application/json", ...rlHeaders } }
      );
    }

    function badField(v: unknown): boolean {
      return v !== undefined && (typeof v !== "string" || v.length === 0);
    }
    if (badField(first_name) || badField(last_name) || badField(email) || badField(password)) {
      return new Response(
        JSON.stringify({ error: "Field values must be non-empty strings." }),
        { status: 400, headers: { "Content-Type": "application/json", ...rlHeaders } }
      );
    }

    if (requiresPassword) {
      // Look up the user's current email for the auth check.
      const meRes = await fetch(`${DIRECTUS_URL}/users/me?fields=id,email`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!meRes.ok) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...rlHeaders },
        });
      }
      const meJson = await meRes.json();
      const currentEmail = meJson?.data?.email;
      if (!currentEmail) {
        return new Response(JSON.stringify({ error: "Could not verify identity." }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...rlHeaders },
        });
      }

      const verifyRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail, password: current_password }),
      });
      if (!verifyRes.ok) {
        return new Response(JSON.stringify({ error: "Current password is incorrect." }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...rlHeaders },
        });
      }
      // Consume the response body and revoke the throwaway session.
      const verifyJson = await verifyRes.json().catch(() => ({}));
      const tmpRefresh = verifyJson?.data?.refresh_token;
      if (tmpRefresh) {
        // Fire-and-forget: revoke the throwaway session
        fetch(`${DIRECTUS_URL}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: tmpRefresh }),
        }).catch(() => {});
      }
    }

    const updateData: Record<string, unknown> = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) updateData.password = password;

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: "No fields to update." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...rlHeaders },
      });
    }

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
      return new Response(
        JSON.stringify({ error: error?.errors?.[0]?.message || "Failed to update profile" }),
        { status: updateResponse.status, headers: { "Content-Type": "application/json", ...rlHeaders } }
      );
    }

    const result = await updateResponse.json();
    return new Response(JSON.stringify({ success: true, user: result.data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  } catch (error: unknown) {
    console.error("Profile update error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Profile update failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
