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
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:register:${identifier}`, RATE_LIMITS.auth);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many registration attempts", retryAfter: rl.retryAfter }), { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }

  try {
    const body = await request.json();

    // Verify Turnstile CAPTCHA
    const clientIp = getClientIdentifier(request);
    const verification = await requireTurnstileVerification(body.turnstileToken, clientIp);
    if (!verification.verified) {
      return new Response(JSON.stringify({ error: verification.error }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: "Validation failed", errors: formatZodErrors(validation.error) }), { status: 400, headers: { "Content-Type": "application/json", ...rlHeaders } });
    }

    const { email, password, firstName, lastName } = validation.data;

    // Register in Directus
    const user = await registerUser({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Registration successful", user: { id: user.id, email: user.email } }),
      { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Registration failed" }), { status: 400, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }
};
