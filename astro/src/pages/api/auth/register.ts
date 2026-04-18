/**
 * POST /api/auth/register
 * Register a new user via Directus with Turnstile CAPTCHA verification.
 */
import type { APIRoute } from "astro";
import { registerUser } from "@/lib/auth";
import { requireTurnstileVerification } from "@/lib/turnstile";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { registerSchema, formatZodErrors } from "@/lib/validation";

export const POST: APIRoute = async ({ request }) => {
  // Skip CSRF validation if no CSRF cookie is set (not yet configured)
  const hasCsrfCookie = (request.headers.get("cookie") || "").includes("csrf_token=");
  if (hasCsrfCookie) {
    const csrf = validateCsrfToken(request);
    if (!csrf.valid) {
      return new Response(JSON.stringify({ error: "Invalid request." }), { status: 403, headers: { "Content-Type": "application/json" } });
    }
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:register:${identifier}`, RATE_LIMITS.auth);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many registration attempts", retryAfter: rl.retryAfter }), { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }

  try {
    const body = await request.json();

    // Verify Turnstile CAPTCHA (skip if not configured)
    const turnstileConfigured = !!import.meta.env.TURNSTILE_SECRET_KEY;
    if (turnstileConfigured) {
      const clientIp = getClientIdentifier(request);
      const verification = await requireTurnstileVerification(body.turnstileToken, clientIp);
      if (!verification.verified) {
        return new Response(JSON.stringify({ error: verification.error }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
    }

    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: "Validation failed", errors: formatZodErrors(validation.error) }), { status: 400, headers: { "Content-Type": "application/json", ...rlHeaders } });
    }

    const { email, password, firstName, lastName } = validation.data;
    const accountType = body.accountType || "patient";

    // Role IDs in Directus
    const ROLE_IDS: Record<string, string> = {
      patient: "2f72336d-c7d5-4c8d-a127-301f687db060",
      professional: "78e53f15-2483-41ac-8285-5b1ec96854e2",
    };

    // Register in Directus (default role is Patient via public_registration_role)
    const user = await registerUser({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });

    // If professional, upgrade role via admin API
    if (accountType === "professional") {
      const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";
      const DIRECTUS_TOKEN = import.meta.env.DIRECTUS_TOKEN;

      if (DIRECTUS_TOKEN) {
        // Find the newly created user by email
        const findRes = await fetch(
          `${DIRECTUS_URL}/users?filter[email][_eq]=${encodeURIComponent(email)}&fields=id`,
          { headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` } }
        );
        const found = await findRes.json();
        const userId = found?.data?.[0]?.id;

        if (userId) {
          await fetch(`${DIRECTUS_URL}/users/${userId}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${DIRECTUS_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ role: ROLE_IDS.professional }),
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Registration successful", user: { id: user.id, email: user.email } }),
      { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Registration failed" }), { status: 400, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }
};
