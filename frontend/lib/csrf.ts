/**
 * CSRF Protection Utilities
 *
 * Implements the Double Submit Cookie pattern:
 * 1. Middleware sets a random CSRF token in a non-httpOnly cookie (readable by JS)
 * 2. Client-side code reads the cookie and sends the token in a custom header
 * 3. API routes validate that the header matches the cookie value
 */

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token from a request.
 * Compares the token in the custom header against the token in the cookie.
 * Only validates for state-changing methods (POST, PATCH, PUT, DELETE).
 */
export function validateCsrfToken(request: Request): { valid: boolean; error?: string } {
  const method = request.method.toUpperCase();

  // Only validate state-changing methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true };
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const cookieToken = cookies[CSRF_COOKIE_NAME];
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken) {
    return { valid: false, error: 'CSRF cookie missing' };
  }

  if (!headerToken) {
    return { valid: false, error: 'CSRF token header missing' };
  }

  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(cookieToken, headerToken)) {
    return { valid: false, error: 'CSRF token mismatch' };
  }

  return { valid: true };
}

/**
 * Parse cookies from a cookie header string
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      cookies[name.trim()] = rest.join('=').trim();
    }
  });
  return cookies;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Pad shorter buffer to prevent length leakage
    const maxLen = Math.max(bufA.length, bufB.length);
    const paddedA = Buffer.alloc(maxLen);
    const paddedB = Buffer.alloc(maxLen);
    bufA.copy(paddedA);
    bufB.copy(paddedB);
    // Always compare, but result includes length mismatch
    const { timingSafeEqual: cryptoEqual } = require('crypto');
    cryptoEqual(paddedA, paddedB);
    return false;
  }
  const { timingSafeEqual: cryptoEqual } = require('crypto');
  return cryptoEqual(bufA, bufB);
}

// Export constants for use in middleware and client code
export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
