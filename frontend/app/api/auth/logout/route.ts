import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';
import { validateCsrfToken } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  // Validate CSRF token
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: 'Invalid request. Please refresh the page and try again.' },
      { status: 403 }
    );
  }

  // Apply rate limiting
  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`auth:logout:${identifier}`, RATE_LIMITS.api);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Please try again in ${rateLimitResult.retryAfter} seconds.`,
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: rateLimitHeaders,
      }
    );
  }

  try {
    const cookieStore = await cookies();

    // Clear auth cookies
    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');

    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { headers: rateLimitHeaders }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
