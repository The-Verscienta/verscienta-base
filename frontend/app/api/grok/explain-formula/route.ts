import { NextRequest, NextResponse } from 'next/server';
import { explainFormula } from '@/lib/grok';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';
import { validateCsrfToken } from '@/lib/csrf';
import { explainFormulaSchema, formatZodErrors } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: 'Invalid request. Please refresh the page and try again.' },
      { status: 403 }
    );
  }

  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`grok:explain:${identifier}`, RATE_LIMITS.ai);
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

    const validation = explainFormulaSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    if (!process.env.XAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.', isConfigError: true },
        { status: 503 }
      );
    }

    const explanation = await explainFormula(validation.data);

    return NextResponse.json({ explanation }, { headers: rateLimitHeaders });
  } catch (error) {
    console.error('Explain formula error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    const isAPIError = message.includes('xAI API error');

    return NextResponse.json(
      {
        error: isAPIError
          ? 'AI service is temporarily unavailable. Please try again later.'
          : 'Failed to generate explanation. Please try again.',
      },
      { status: isAPIError ? 503 : 500, headers: rateLimitHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
