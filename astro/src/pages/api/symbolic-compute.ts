/**
 * POST /api/symbolic-compute
 * Proxy to SymPy compute microservice for dosage calculations and symbolic math.
 */
import type { APIRoute } from "astro";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { symbolicComputeSchema, dosageComputeSchema, formatZodErrors } from "@/lib/validation";

const SYMPY_URL = import.meta.env.SYMPY_SERVICE_URL || "http://localhost:8001";
const SYMPY_KEY = import.meta.env.SYMPY_API_KEY;

export const POST: APIRoute = async ({ request }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`symbolic:${identifier}`, RATE_LIMITS.symbolic);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded", retryAfter: rl.retryAfter }), { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }

  try {
    const body = await request.json();
    const isDosage = "herb_name" in body;

    // Validate
    const schema = isDosage ? dosageComputeSchema : symbolicComputeSchema;
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: "Validation failed", errors: formatZodErrors(validation.error) }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    if (!SYMPY_KEY) {
      return new Response(JSON.stringify({ error: "Symbolic compute service is not configured.", isConfigError: true }), { status: 503, headers: { "Content-Type": "application/json" } });
    }

    // Forward to SymPy service
    const endpoint = isDosage ? "/dosage" : "/compute";
    const response = await fetch(`${SYMPY_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": SYMPY_KEY,
      },
      body: JSON.stringify(validation.data),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Service error");
      throw new Error(`SymPy service error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return new Response(JSON.stringify({ success: true, ...result }), { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } });
  } catch (error) {
    console.error("Symbolic compute error:", error);
    const message = error instanceof Error ? error.message : "An error occurred";
    const isServiceError = message.includes("SymPy");

    return new Response(
      JSON.stringify({ error: isServiceError ? "Symbolic compute service is temporarily unavailable." : "Failed to process computation." }),
      { status: isServiceError ? 503 : 500, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }
};
