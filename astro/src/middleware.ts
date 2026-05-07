/**
 * Astro Middleware — Security Headers, CSRF, Auth Refresh
 *
 * Sets CSP, HSTS, CSRF token cookie, security headers, and transparently
 * refreshes the Directus access_token using the refresh_token cookie when
 * the access_token is missing or close to expiry.
 *
 * The freshly-refreshed token is published on `Astro.locals.accessToken`
 * so endpoints can read it via getAuthedUser(request, locals) without
 * waiting for the next browser round-trip with the new cookie.
 */

import { defineMiddleware } from "astro:middleware";
import { generateCsrfToken, CSRF_COOKIE_NAME } from "./lib/csrf";
import { refreshAccessToken } from "./lib/auth";

/** Refresh tokens that expire within this many seconds — gives downstream
 *  fetches a small buffer so they never see an already-expired token. */
const REFRESH_LEEWAY_SECONDS = 30;

/** Decode a JWT payload (base64url JSON). Returns null on any malformed input. */
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = (4 - (payload.length % 4)) % 4;
    payload += "=".repeat(pad);
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function readCookie(header: string, name: string): string | null {
  const re = new RegExp(`(?:^|;\\s*)${name}=([^;]*)`);
  const m = header.match(re);
  return m ? decodeURIComponent(m[1]) : null;
}

function isExpiredOrSoon(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true; // unknown → treat as expired to force refresh
  return Date.now() / 1000 >= payload.exp - REFRESH_LEEWAY_SECONDS;
}

export const onRequest = defineMiddleware(async ({ request, locals }, next) => {
  const isProd = import.meta.env.PROD;
  const cookieHeader = request.headers.get("cookie") || "";

  // ── Lazy access_token refresh ─────────────────────────────────────────────
  const accessToken = readCookie(cookieHeader, "access_token");
  const refreshToken = readCookie(cookieHeader, "refresh_token");

  let refreshed: { access_token: string; refresh_token?: string; expires: number } | null = null;

  if (refreshToken && (!accessToken || isExpiredOrSoon(accessToken))) {
    try {
      refreshed = await refreshAccessToken(refreshToken);
      (locals as { accessToken?: string }).accessToken = refreshed.access_token;
    } catch {
      // Refresh failed — token revoked or Directus unreachable. Leave the
      // (probably expired) access_token in place; downstream auth checks
      // will return 401 and prompt the user to sign in again.
    }
  } else if (accessToken) {
    (locals as { accessToken?: string }).accessToken = accessToken;
  }

  // ── Run downstream ────────────────────────────────────────────────────────
  const response = await next();

  // Generate request ID for tracing
  const requestId = crypto.randomUUID();

  const headers = new Headers(response.headers);

  // ── Security Headers ──────────────────────────────────────────────────────
  // NOTE: CSP is now managed by Astro's experimental.csp (astro.config.mjs).
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
  const hasCsrf = cookieHeader.includes(CSRF_COOKIE_NAME);
  if (!hasCsrf) {
    const csrfToken = generateCsrfToken();
    const cookieFlags = isProd
      ? "Path=/; SameSite=Lax; Secure"
      : "Path=/; SameSite=Lax";
    headers.append("Set-Cookie", `${CSRF_COOKIE_NAME}=${csrfToken}; ${cookieFlags}`);
  }

  // ── Auth Refresh Cookies ──────────────────────────────────────────────────
  // If middleware refreshed the access_token, send the new pair down so
  // the browser persists them and subsequent requests don't re-refresh.
  if (refreshed) {
    const secure = isProd ? "; Secure" : "";
    headers.append(
      "Set-Cookie",
      `access_token=${refreshed.access_token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${Math.floor(refreshed.expires / 1000)}${secure}`
    );
    if (refreshed.refresh_token) {
      headers.append(
        "Set-Cookie",
        `refresh_token=${refreshed.refresh_token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}${secure}`
      );
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
