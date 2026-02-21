import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';
import { validateCsrfToken } from '@/lib/csrf';
import { loginSchema, formatZodErrors } from '@/lib/validation';

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
  const rateLimitResult = checkRateLimit(`auth:login:${identifier}`, RATE_LIMITS.auth);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many login attempts',
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
    const body = await request.json();

    // Validate with Zod schema
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const { username, password } = validation.data;

    // Authenticate with Drupal
    const tokens = await authenticateUser(username, password);

    // Store tokens in HTTP-only cookies
    const cookieStore = await cookies();

    // Set access token (expires in 1 hour by default)
    cookieStore.set('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in,
      path: '/',
    });

    // Set refresh token if available
    if (tokens.refresh_token) {
      cookieStore.set('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Authentication successful',
      },
      { headers: rateLimitHeaders }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 401, headers: rateLimitHeaders }
    );
  }
}
