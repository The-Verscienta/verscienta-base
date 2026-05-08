/**
 * GET  /api/auth/preferences  → read the user_preferences row for current user
 * PATCH /api/auth/preferences → upsert preferred_practitioner
 */
import type { APIRoute } from "astro";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { getRequestAccessToken } from "@/lib/auth-server";

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";

const PRACTITIONER_FIELDS = "preferred_practitioner.id,preferred_practitioner.first_name,preferred_practitioner.last_name";

interface PreferencesRow {
  id: string;
  preferred_practitioner: { id: string; first_name?: string; last_name?: string } | string | null;
}

async function fetchMe(accessToken: string): Promise<{ id: string } | null> {
  const res = await fetch(`${DIRECTUS_URL}/users/me?fields=id`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}

async function fetchPreferencesRow(accessToken: string, userId: string): Promise<PreferencesRow | null> {
  const url = `${DIRECTUS_URL}/items/user_preferences?filter[user][_eq]=${encodeURIComponent(userId)}&fields=id,${PRACTITIONER_FIELDS}&limit=1`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data?.[0] ?? null;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:prefs:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const accessToken = getRequestAccessToken(request, locals);
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const me = await fetchMe(accessToken);
  if (!me) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const row = await fetchPreferencesRow(accessToken, me.id);
  const preferred = row?.preferred_practitioner;
  const expanded =
    preferred && typeof preferred === "object"
      ? { id: preferred.id, first_name: preferred.first_name, last_name: preferred.last_name }
      : null;

  return new Response(JSON.stringify({ preferred_practitioner: expanded }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...rlHeaders },
  });
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:prefs:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const accessToken = getRequestAccessToken(request, locals);
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const body = await request.json().catch(() => ({}));
  if (!Object.prototype.hasOwnProperty.call(body, "preferred_practitioner")) {
    return new Response(JSON.stringify({ error: "preferred_practitioner is required (use null to clear)." }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }
  const value: string | null = body.preferred_practitioner;

  // Validate type: must be string or null (no numbers, booleans, objects)
  if (value !== null && typeof value !== "string") {
    return new Response(JSON.stringify({ error: "preferred_practitioner must be a string or null." }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const me = await fetchMe(accessToken);
  if (!me) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const existing = await fetchPreferencesRow(accessToken, me.id);

  const targetUrl = existing
    ? `${DIRECTUS_URL}/items/user_preferences/${existing.id}`
    : `${DIRECTUS_URL}/items/user_preferences`;
  const method = existing ? "PATCH" : "POST";
  const payload = existing
    ? { preferred_practitioner: value }
    : { user: me.id, preferred_practitioner: value };

  const writeRes = await fetch(targetUrl, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!writeRes.ok) {
    const error = await writeRes.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ error: error?.errors?.[0]?.message || "Failed to update preferences" }),
      { status: writeRes.status, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }

  const result = await writeRes.json();
  return new Response(
    JSON.stringify({ success: true, preferences: { preferred_practitioner: result?.data?.preferred_practitioner ?? null } }),
    { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } }
  );
};
