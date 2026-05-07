/**
 * GET  /api/reports     — list the current user's saved reports
 * POST /api/reports     — save a new report
 *
 * Auth: requires the access_token cookie (set by /api/auth/login).
 * Saves are scoped to the current user via Directus's user-created field
 * special (user_id auto-populated).
 */
import type { APIRoute } from "astro";
import { z } from "zod";
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { getRequestAccessToken } from "@/lib/auth-server";

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";

const reportSchema = z.object({
  report_type: z.enum(["interaction_check", "formula_explanation", "symptom_analysis", "other"]),
  title: z.string().min(1).max(200),
  summary: z.string().max(1000).optional(),
  data: z.record(z.string(), z.any()).optional(),
});

function unauthorized(rlHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: "Sign in to save reports." }), {
    status: 401,
    headers: { "Content-Type": "application/json", ...rlHeaders },
  });
}

export const GET: APIRoute = async ({ request, url, locals }) => {
  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`reports:list:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const accessToken = getRequestAccessToken(request, locals);
  if (!accessToken) return unauthorized(rlHeaders);

  const reportType = url.searchParams.get("type");
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));

  try {
    const params = new URLSearchParams();
    params.set("fields", "id,report_type,title,summary,date_created");
    params.set("sort", "-date_created");
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    if (reportType) params.set("filter[report_type][_eq]", reportType);

    const res = await fetch(`${DIRECTUS_URL}/items/saved_reports?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 401 || res.status === 403) return unauthorized(rlHeaders);
    const data = await res.json();
    return new Response(JSON.stringify({ reports: data.data || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  } catch (err) {
    console.error("Reports list error:", err);
    return new Response(JSON.stringify({ error: "Failed to load reports" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`reports:save:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const accessToken = getRequestAccessToken(request, locals);
  if (!accessToken) return unauthorized(rlHeaders);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Validation failed", errors: parsed.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  // Map our snake_case enum to Directus's display values
  const typeDisplay: Record<string, string> = {
    interaction_check: "Interaction Check",
    formula_explanation: "Formula Explanation",
    symptom_analysis: "Symptom Analysis",
    other: "Other",
  };

  try {
    const res = await fetch(`${DIRECTUS_URL}/items/saved_reports`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        report_type: typeDisplay[parsed.data.report_type],
        title: parsed.data.title,
        summary: parsed.data.summary,
        data: parsed.data.data || null,
      }),
    });
    if (res.status === 401 || res.status === 403) return unauthorized(rlHeaders);
    const data = await res.json();
    if (!res.ok) {
      console.error("Directus save error:", data);
      return new Response(JSON.stringify({ error: "Failed to save report" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...rlHeaders },
      });
    }
    return new Response(JSON.stringify({ report: data.data }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  } catch (err) {
    console.error("Reports save error:", err);
    return new Response(JSON.stringify({ error: "Failed to save report" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }
};
