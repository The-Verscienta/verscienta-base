/**
 * POST /api/grok/symptom-analysis
 * Analyze symptoms using xAI Grok for TCM pattern matching.
 */
import type { APIRoute } from "astro";
import { analyzeSymptoms } from "@/lib/grok";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { symptomAnalysisSchema, formatZodErrors } from "@/lib/validation";

export const POST: APIRoute = async ({ request }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request. Please refresh the page and try again." }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`grok:analysis:${identifier}`, RATE_LIMITS.ai);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded", message: `Too many requests. Please try again in ${rl.retryAfter} seconds.`, retryAfter: rl.retryAfter }), { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }

  try {
    const body = await request.json();
    const validation = symptomAnalysisSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: "Validation failed", errors: formatZodErrors(validation.error) }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    if (!import.meta.env.XAI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service is not configured.", isConfigError: true }), { status: 503, headers: { "Content-Type": "application/json" } });
    }

    const { symptoms, followUpAnswers, context } = validation.data;
    const analysis = await analyzeSymptoms({ symptoms: symptoms.trim(), followUpAnswers, context });

    return new Response(JSON.stringify({ success: true, ...analysis }), { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } });
  } catch (error) {
    console.error("Symptom analysis error:", error);
    const message = error instanceof Error ? error.message : "An error occurred";
    const isAPIError = message.includes("Grok API error");

    return new Response(
      JSON.stringify({ error: isAPIError ? "AI service is temporarily unavailable." : "Failed to analyze symptoms." }),
      { status: isAPIError ? 503 : 500, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }
};
