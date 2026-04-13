import { NextRequest, NextResponse } from 'next/server';
import { checkHerbDrugInteractions } from '@/lib/grok';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';
import { validateCsrfToken } from '@/lib/csrf';
import { herbDrugCheckSchema, formatZodErrors } from '@/lib/validation';

export async function POST(request: NextRequest) {
  // Validate CSRF token
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: 'Invalid request. Please refresh the page and try again.' },
      { status: 403 }
    );
  }

  // Apply rate limiting (ai tier — same as symptom analysis)
  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`grok:drugcheck:${identifier}`, RATE_LIMITS.ai);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`,
        retryAfter: rateLimitResult.retryAfter,
      },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    const body = await request.json();

    const validation = herbDrugCheckSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const { medications } = validation.data;

    if (!process.env.XAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.', isConfigError: true },
        { status: 503 }
      );
    }

    const medList = medications
      .split(/[,\n]+/)
      .map((m) => m.trim())
      .filter(Boolean);

    const result = await checkHerbDrugInteractions(medList);

    return NextResponse.json({ success: true, ...result }, { headers: rateLimitHeaders });
  } catch (error) {
    console.error('Herb-drug check error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    const isAPIError = message.includes('xAI API error');

    return NextResponse.json(
      {
        error: isAPIError
          ? 'AI service is temporarily unavailable. Please try again later.'
          : 'Failed to check interactions. Please try again.',
      },
      { status: isAPIError ? 503 : 500, headers: rateLimitHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://verscienta.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
