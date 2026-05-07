/**
 * GET    /api/reports/:id   — fetch a single saved report (must own)
 * DELETE /api/reports/:id   — delete a saved report (must own)
 */
import type { APIRoute } from "astro";
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { getRequestAccessToken } from "@/lib/auth-server";

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";

function unauthorized(rlHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: "Sign in to access reports." }), {
    status: 401,
    headers: { "Content-Type": "application/json", ...rlHeaders },
  });
}

export const GET: APIRoute = async ({ request, params, locals }) => {
  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`reports:get:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const accessToken = getRequestAccessToken(request, locals);
  if (!accessToken) return unauthorized(rlHeaders);

  try {
    const res = await fetch(`${DIRECTUS_URL}/items/saved_reports/${encodeURIComponent(params.id!)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 401 || res.status === 403) return unauthorized(rlHeaders);
    if (res.status === 404) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...rlHeaders },
      });
    }
    const data = await res.json();
    return new Response(JSON.stringify({ report: data.data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  } catch (err) {
    console.error("Report fetch error:", err);
    return new Response(JSON.stringify({ error: "Failed to load report" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }
};

export const DELETE: APIRoute = async ({ request, params, locals }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`reports:del:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const accessToken = getRequestAccessToken(request, locals);
  if (!accessToken) return unauthorized(rlHeaders);

  try {
    const res = await fetch(`${DIRECTUS_URL}/items/saved_reports/${encodeURIComponent(params.id!)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 401 || res.status === 403) return unauthorized(rlHeaders);
    if (res.status === 404) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...rlHeaders },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  } catch (err) {
    console.error("Report delete error:", err);
    return new Response(JSON.stringify({ error: "Failed to delete report" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }
};
