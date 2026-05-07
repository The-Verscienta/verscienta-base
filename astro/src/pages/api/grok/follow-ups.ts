/**
 * POST /api/grok/follow-ups
 * Generate follow-up questions for symptom analysis.
 */
import type { APIRoute } from "astro";
import { generateFollowUpQuestions } from "@/lib/grok";
import { getAiEnv, hasAiKey } from "@/lib/env";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";

export const POST: APIRoute = async ({ request, locals }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`grok:followups:${identifier}`, RATE_LIMITS.ai);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded", retryAfter: rl.retryAfter }), { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }

  try {
    const body = await request.json();
    const { symptoms, previousAnswers } = body;

    if (!symptoms || typeof symptoms !== "string") {
      return new Response(JSON.stringify({ error: "Symptoms are required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const env = getAiEnv(locals);
    if (!hasAiKey(env)) {
      return new Response(JSON.stringify({ error: "AI service is not configured", isConfigError: true }), { status: 503, headers: { "Content-Type": "application/json" } });
    }

    const questions = await generateFollowUpQuestions(symptoms.trim(), previousAnswers, env);
    return new Response(JSON.stringify({ success: true, questions }), { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } });
  } catch (error) {
    console.error("Follow-up questions error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate follow-up questions" }), { status: 500, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }
};
