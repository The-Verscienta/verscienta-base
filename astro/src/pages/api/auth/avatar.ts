/**
 * POST   /api/auth/avatar  → upload + set avatar (multipart)
 * DELETE /api/auth/avatar  → clear avatar (file is left in Directus storage)
 */
import type { APIRoute } from "astro";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { getRequestAccessToken } from "@/lib/auth-server";

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export const POST: APIRoute = async ({ request, locals }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:avatar:${identifier}`, RATE_LIMITS.api);
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

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid form data." }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: "Missing 'file' field." }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return new Response(
      JSON.stringify({ error: "Unsupported file type. Use JPEG, PNG, or WebP." }),
      { status: 415, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }
  if (file.size > MAX_BYTES) {
    return new Response(JSON.stringify({ error: "File too large (max 2MB)." }), {
      status: 413,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  // Upload to Directus /files
  const upload = new FormData();
  upload.append("file", file, file.name);
  const uploadRes = await fetch(`${DIRECTUS_URL}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: upload,
  });
  if (!uploadRes.ok) {
    const error = await uploadRes.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ error: error?.errors?.[0]?.message || "Upload failed" }),
      { status: uploadRes.status, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }
  const uploadJson = await uploadRes.json();
  const fileId = uploadJson?.data?.id;
  if (!fileId) {
    return new Response(JSON.stringify({ error: "Upload returned no file id." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  // Set on user
  const patchRes = await fetch(`${DIRECTUS_URL}/users/me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ avatar: fileId }),
  });
  if (!patchRes.ok) {
    const error = await patchRes.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ error: error?.errors?.[0]?.message || "Failed to set avatar" }),
      { status: patchRes.status, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }

  return new Response(JSON.stringify({ success: true, avatar: fileId }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...rlHeaders },
  });
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:avatar:${identifier}`, RATE_LIMITS.api);
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

  const patchRes = await fetch(`${DIRECTUS_URL}/users/me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ avatar: null }),
  });
  if (!patchRes.ok) {
    const error = await patchRes.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ error: error?.errors?.[0]?.message || "Failed to clear avatar" }),
      { status: patchRes.status, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...rlHeaders },
  });
};
