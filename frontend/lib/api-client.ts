/**
 * API Client with CSRF protection
 *
 * Wraps fetch() to automatically include the CSRF token header
 * for all state-changing requests (POST, PATCH, PUT, DELETE).
 */

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/csrf';

/**
 * Read the CSRF token from the cookie
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Fetch wrapper that automatically includes CSRF token for state-changing requests.
 * Use this instead of raw fetch() for all API calls.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers);

  // Add CSRF token for state-changing methods
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  // Default to JSON content type if body is present and no content-type set
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
