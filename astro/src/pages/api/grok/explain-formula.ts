/**
 * POST /api/grok/explain-formula
 * Generate patient-friendly formula explanations using xAI Grok.
 */
import type { APIRoute } from "astro";
import { explainFormula } from "@/lib/grok";
import { getAiEnv, hasAiKey } from "@/lib/env";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { explainFormulaSchema, formatZodErrors } from "@/lib/validation";

export const POST: APIRoute = async ({ request, locals }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`grok:explain:${identifier}`, RATE_LIMITS.ai);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded", retryAfter: rl.retryAfter }), { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }

  try {
    const body = await request.json();
    const validation = explainFormulaSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: "Validation failed", errors: formatZodErrors(validation.error) }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const env = getAiEnv(locals);
    if (!hasAiKey(env)) {
      return new Response(JSON.stringify({ error: "AI service is not configured.", isConfigError: true }), { status: 503, headers: { "Content-Type": "application/json" } });
    }

    const explanation = await explainFormula(validation.data, env);
    return new Response(JSON.stringify({ explanation }), { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } });
  } catch (error) {
    console.error("Explain formula error:", error);
    const message = error instanceof Error ? error.message : "An error occurred";
    const isAPIError = message.includes("Grok API error");

    return new Response(
      JSON.stringify({ error: isAPIError ? "AI service is temporarily unavailable." : "Failed to generate explanation." }),
      { status: isAPIError ? 503 : 500, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }
};
