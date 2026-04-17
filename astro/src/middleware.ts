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

  // Generate per-request nonce for CSP
  const nonceArray = new Uint8Array(16);
  crypto.getRandomValues(nonceArray);
  const nonce = Array.from(nonceArray, (b) => b.toString(16).padStart(2, "0")).join("");

  // Generate request ID for tracing
  const requestId = crypto.randomUUID();

  // ── Content Security Policy ───────────────────────────────────────────────
  const cspDirectives = isProd
    ? [
        `default-src 'self'`,
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
        `img-src 'self' data: https: blob:`,
        `font-src 'self' https://fonts.gstatic.com`,
        `connect-src 'self' ${import.meta.env.PUBLIC_DIRECTUS_URL || ""} ${import.meta.env.PUBLIC_MEILI_URL || ""} https://challenges.cloudflare.com`,
        `frame-src https://challenges.cloudflare.com`,
        `object-src 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`,
      ].join("; ")
    : [
        `default-src 'self'`,
        `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
        `img-src 'self' data: https: blob: http://localhost:*`,
        `font-src 'self' https://fonts.gstatic.com`,
        `connect-src 'self' http://localhost:* ws://localhost:*`,
        `frame-src https://challenges.cloudflare.com`,
      ].join("; ");

  // ── Security Headers ──────────────────────────────────────────────────────
  const headers = new Headers(response.headers);

  headers.set("Content-Security-Policy", cspDirectives);
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
