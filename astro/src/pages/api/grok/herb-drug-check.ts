/**
 * POST /api/grok/herb-drug-check
 * Check herb-drug interactions using xAI Grok.
 */
import type { APIRoute } from "astro";
import { checkHerbDrugInteractions } from "@/lib/grok";
import { getAiEnv, hasAiKey } from "@/lib/env";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { herbDrugCheckSchema, formatZodErrors } from "@/lib/validation";

export const POST: APIRoute = async ({ request, locals }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`grok:drugcheck:${identifier}`, RATE_LIMITS.ai);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded", retryAfter: rl.retryAfter }), { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }

  try {
    const body = await request.json();
    const validation = herbDrugCheckSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: "Validation failed", errors: formatZodErrors(validation.error) }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const env = getAiEnv(locals);
    if (!hasAiKey(env)) {
      return new Response(JSON.stringify({ error: "AI service is not configured.", isConfigError: true }), { status: 503, headers: { "Content-Type": "application/json" } });
    }

    const medList = validation.data.medications.split(/[,\n]+/).map((m) => m.trim()).filter(Boolean);
    const herbList = validation.data.herbs?.map((h) => h.trim()).filter(Boolean);
    const result = await checkHerbDrugInteractions(medList, herbList, env);

    return new Response(JSON.stringify({ success: true, ...result }), { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } });
  } catch (error) {
    console.error("Herb-drug check error:", error);
    const message = error instanceof Error ? error.message : "An error occurred";
    const isAPIError = message.includes("Grok API error");

    return new Response(
      JSON.stringify({ error: isAPIError ? "AI service is temporarily unavailable." : "Failed to check interactions." }),
      { status: isAPIError ? 503 : 500, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }
};
