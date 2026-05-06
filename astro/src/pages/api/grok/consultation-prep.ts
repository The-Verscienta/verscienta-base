/**
 * POST /api/grok/consultation-prep
 *
 * Open to all authenticated users (patient + professional).
 * Generates questions, observations, and prep tips for an upcoming consultation.
 */
import type { APIRoute } from "astro";
import { consultationPrep } from "@/lib/grok";
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { consultationPrepSchema, formatZodErrors } from "@/lib/validation";
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
  const rl = checkRateLimit(`grok:consult:${identifier}`, RATE_LIMITS.ai);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded", retryAfter: rl.retryAfter }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const user = await getAuthedUser(request);
  if (!user) return gatedResponse("auth", rlHeaders);
  if (!userHasAccess(user, "authenticated")) return gatedResponse("auth", rlHeaders);

  try {
    const body = await request.json();
    const parsed = consultationPrepSchema.safeParse(body);
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

    const result = await consultationPrep(parsed.data);
    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  } catch (error) {
    console.error("Consultation prep error:", error);
    const message = error instanceof Error ? error.message : "An error occurred";
    const isAPIError = message.includes("Grok API error");
    return new Response(
      JSON.stringify({ error: isAPIError ? "AI service is temporarily unavailable." : "Failed to generate prep guide." }),
      { status: isAPIError ? 503 : 500, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }
};
