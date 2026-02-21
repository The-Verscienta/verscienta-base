import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import { requireTurnstileVerification } from '@/lib/turnstile';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';
import { validateCsrfToken } from '@/lib/csrf';
import { registerSchema, formatZodErrors } from '@/lib/validation';

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
  const rateLimitResult = checkRateLimit(`auth:register:${identifier}`, RATE_LIMITS.auth);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many registration attempts',
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

    // Verify Turnstile CAPTCHA
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    const verification = await requireTurnstileVerification(body.turnstileToken, clientIp);

    if (!verification.verified) {
      return NextResponse.json(
        { error: verification.error },
        { status: 400 }
      );
    }

    // Validate with Zod schema
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: formatZodErrors(validation.error) },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const { username, email, password, firstName, lastName } = validation.data;

    // Register user in Drupal
    const user = await registerUser({
      name: username,
      mail: email,
      pass: password,
      field_first_name: firstName,
      field_last_name: lastName,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.mail,
        },
      },
      { headers: rateLimitHeaders }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 400, headers: rateLimitHeaders }
    );
  }
}
