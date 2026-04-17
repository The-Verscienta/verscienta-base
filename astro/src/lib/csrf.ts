/**
 * CSRF Protection Utilities
 *
 * Implements the Double Submit Cookie pattern.
 * Ported from frontend/lib/csrf.ts — no framework-specific code.
 *
 * Changes from Next.js version:
 *   - Uses Web Crypto API subtle for timing-safe comparison (no Node.js crypto import)
 *   - Works in Cloudflare Workers runtime
 */

export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate CSRF token from a request.
 * Compares the token in the custom header against the token in the cookie.
 * Only validates for state-changing methods (POST, PATCH, PUT, DELETE).
 */
export function validateCsrfToken(request: Request): { valid: boolean; error?: string } {
  const method = request.method.toUpperCase();

  // Only validate state-changing methods
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { valid: true };
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const cookieToken = cookies[CSRF_COOKIE_NAME];
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken) {
    return { valid: false, error: "CSRF cookie missing" };
  }

  if (!headerToken) {
    return { valid: false, error: "CSRF token header missing" };
  }

  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(cookieToken, headerToken)) {
    return { valid: false, error: "CSRF token mismatch" };
  }

  return { valid: true };
}

/**
 * Parse cookies from a cookie header string
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) {
      cookies[name.trim()] = rest.join("=").trim();
    }
  });
  return cookies;
}

/**
 * Constant-time string comparison using Web Crypto API compatible approach.
 * Works in both Node.js and Cloudflare Workers.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}
