import { NextRequest, NextResponse } from 'next/server';
import { validateCsrfToken } from '@/lib/csrf';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: 'Invalid request. Please refresh the page and try again.' },
      { status: 403 }
    );
  }

  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`symbolic-feedback:${identifier}`, RATE_LIMITS.api);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    const body = await request.json();
    const { query, result, rating, comment } = body;

    if (!query || !result || typeof rating !== 'string' || !['up', 'down'].includes(rating)) {
      return NextResponse.json(
        { error: 'Invalid feedback payload' },
        { status: 400 }
      );
    }

    // Log feedback — in production this should write to a database
    if (process.env.NODE_ENV === 'development') {
      console.log('[SymbolicFeedback]', JSON.stringify({
        timestamp: new Date().toISOString(),
        clientId: identifier,
        query,
        result,
        rating,
        comment: comment || null,
      }));
    }

    return NextResponse.json(
      { success: true },
      { headers: rateLimitHeaders }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}
