/**
 * POST /api/auth/login
 * Authenticate user via Directus, store tokens in HTTP-only cookies.
 */
import type { APIRoute } from "astro";
import { authenticateUser } from "@/lib/auth";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { loginSchema, formatZodErrors } from "@/lib/validation";

export const POST: APIRoute = async ({ request }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request. Please refresh the page and try again." }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:login:${identifier}`, RATE_LIMITS.auth);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many login attempts", message: `Please try again in ${rl.retryAfter} seconds.`, retryAfter: rl.retryAfter }), { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }

  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: "Validation failed", errors: formatZodErrors(validation.error) }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const { email, password } = validation.data;
    const tokens = await authenticateUser(email, password);
    const isProd = import.meta.env.PROD;
    const secure = isProd ? "; Secure" : "";

    const headers = new Headers({ "Content-Type": "application/json", ...rlHeaders });
    // Set access token cookie
    headers.append("Set-Cookie", `access_token=${tokens.access_token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${Math.floor(tokens.expires / 1000)}${secure}`);
    // Set refresh token cookie
    if (tokens.refresh_token) {
      headers.append("Set-Cookie", `refresh_token=${tokens.refresh_token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}${secure}`);
    }

    return new Response(JSON.stringify({ success: true, message: "Authentication successful" }), { status: 200, headers });
  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Authentication failed" }), { status: 401, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }
};
