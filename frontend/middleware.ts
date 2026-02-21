import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateCsrfToken, CSRF_COOKIE_NAME } from '@/lib/csrf';

/**
 * Generate a cryptographically secure nonce for CSP
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

/**
 * Generate a unique request ID for tracking and security logging
 */
function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Security middleware that adds security headers to all responses
 */
export function middleware(request: NextRequest) {
  // Generate unique identifiers for this request
  const nonce = generateNonce();
  const requestId = generateRequestId();

  // Content Security Policy with nonce for stricter security
  const isProduction = process.env.NODE_ENV === 'production';

  const cspDirectives = [
    "default-src 'self'",
    isProduction
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-src 'self' https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  if (isProduction) {
    cspDirectives.push("upgrade-insecure-requests");
  }

  const cspHeader = cspDirectives.join('; ');

  // Pass nonce to Next.js via request header so it can add it to inline scripts
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set security headers on the response
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Request-Id', requestId);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Set CSRF token cookie if not already present
  const existingCsrf = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!existingCsrf) {
    const csrfToken = generateCsrfToken();
    response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false, // Must be readable by JavaScript
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    });
  }

  return response;
}

// Apply to all routes except static files and API routes that need different headers
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
