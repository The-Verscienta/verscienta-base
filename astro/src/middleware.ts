/**
 * Astro Middleware — Security Headers & CSRF
 *
 * Replaces frontend/middleware.ts (Next.js middleware).
 * Sets CSP, HSTS, CSRF token cookie, and security headers on every request.
 */

import { defineMiddleware } from "astro:middleware";
import { generateCsrfToken, CSRF_COOKIE_NAME } from "./lib/csrf";

export const onRequest = defineMiddleware(async ({ request, url }, next) => {
  const response = await next();
  const isProd = import.meta.env.PROD;

  // Generate request ID for tracing
  const requestId = crypto.randomUUID();

  // ── Security Headers ──────────────────────────────────────────────────────
  // NOTE: CSP is now managed by Astro's experimental.csp (astro.config.mjs).
  // Astro automatically hashes all inline/hydration scripts and sets the
  // Content-Security-Policy header on SSR responses.
  const headers = new Headers(response.headers);

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("X-Request-Id", requestId);

  if (isProd) {
    headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  // ── CSRF Token Cookie ─────────────────────────────────────────────────────
  const cookieHeader = request.headers.get("cookie") || "";
  const hasCsrf = cookieHeader.includes(CSRF_COOKIE_NAME);

  if (!hasCsrf) {
    const csrfToken = generateCsrfToken();
    const cookieFlags = isProd
      ? "Path=/; SameSite=Lax; Secure"
      : "Path=/; SameSite=Lax";
    headers.append("Set-Cookie", `${CSRF_COOKIE_NAME}=${csrfToken}; ${cookieFlags}`);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
