/**
 * POST /api/grok/safety-check
 *
 * GATED: Professional Access + Administrator only.
 * Evaluates safety of an herb or formula in a specific patient context.
 */
import type { APIRoute } from "astro";
import { safetyCheck } from "@/lib/grok";
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { safetyCheckSchema, formatZodErrors } from "@/lib/validation";
import { getAuthedUser, userHasAccess, gatedResponse } from "@/lib/auth-server";

export const POST: APIRoute = async ({ request }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`grok:safety:${identifier}`, RATE_LIMITS.ai);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded", retryAfter: rl.retryAfter }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const user = await getAuthedUser(request);
  if (!user) return gatedResponse("auth", rlHeaders);
  if (!userHasAccess(user, "professional")) return gatedResponse("upgrade", rlHeaders);

  try {
    const body = await request.json();
    const parsed = safetyCheckSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Validation failed", errors: formatZodErrors(parsed.error) }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...rlHeaders },
      });
    }

    if (!import.meta.env.XAI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service is not configured.", isConfigError: true }), {
        status: 503,
        headers: { "Content-Type": "application/json", ...rlHeaders },
      });
    }

    const result = await safetyCheck(parsed.data);
    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  } catch (error) {
    console.error("Safety check error:", error);
    const message = error instanceof Error ? error.message : "An error occurred";
    const isAPIError = message.includes("Grok API error");
    return new Response(
      JSON.stringify({ error: isAPIError ? "AI service is temporarily unavailable." : "Failed to evaluate safety." }),
      { status: isAPIError ? 503 : 500, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }
};
