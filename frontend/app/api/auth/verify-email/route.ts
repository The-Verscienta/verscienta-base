import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';
import { validateVerificationToken } from '@/lib/verification-token';

/**
 * GET: Verify email with token from email link
 * The token is passed as a query parameter: /api/auth/verify-email?token=xxx&uid=xxx
 *
 * The token is an HMAC-based token generated during registration, tied to the
 * user ID and a timestamp. It expires after 24 hours.
 */
export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`auth:verify:${identifier}`, RATE_LIMITS.auth);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const uid = url.searchParams.get('uid');

    if (!token || !uid) {
      return NextResponse.json(
        { error: 'Missing verification token or user ID.' },
        { status: 400 }
      );
    }

    // Validate the HMAC-based verification token
    const tokenResult = await validateVerificationToken(token, uid);
    if (!tokenResult.valid) {
      return NextResponse.json(
        { error: tokenResult.error === 'Token has expired'
            ? 'Verification link has expired. Please request a new one.'
            : 'Invalid verification link. Please request a new one.' },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const drupalUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL;

    // Activate the user in Drupal
    const response = await fetch(
      `${drupalUrl}/jsonapi/user/user/${uid}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${process.env.DRUPAL_ADMIN_TOKEN || ''}`,
        },
        body: JSON.stringify({
          data: {
            type: 'user--user',
            id: uid,
            attributes: {
              status: true,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Email verification failed. The link may have expired.' },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Email verified successfully. You can now log in.' },
      { headers: rateLimitHeaders }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed. Please try again or contact support.' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
