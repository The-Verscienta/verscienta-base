import { NextRequest, NextResponse } from 'next/server';
import { computeSymbolic, computeDosage } from '@/lib/sympy-compute';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';
import { validateCsrfToken } from '@/lib/csrf';
import { symbolicComputeSchema, dosageComputeSchema, formatZodErrors } from '@/lib/validation';

export async function POST(request: NextRequest) {
  // Validate CSRF token
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: 'Invalid request. Please refresh the page and try again.' },
      { status: 403 }
    );
  }

  // Apply rate limiting for symbolic compute endpoints
  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`symbolic:${identifier}`, RATE_LIMITS.symbolic);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`,
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

    // Determine request type from body
    const isDosage = 'herb_name' in body;

    if (isDosage) {
      // Validate with dosage schema
      const validation = dosageComputeSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', errors: formatZodErrors(validation.error) },
          { status: 400 }
        );
      }

      if (!process.env.SYMPY_API_KEY) {
        return NextResponse.json(
          { error: 'Symbolic compute service is not configured.', isConfigError: true },
          { status: 503 }
        );
      }

      const result = await computeDosage(validation.data);

      return NextResponse.json(
        { success: true, ...result },
        { headers: rateLimitHeaders }
      );
    } else {
      // Validate with symbolic compute schema
      const validation = symbolicComputeSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', errors: formatZodErrors(validation.error) },
          { status: 400 }
        );
      }

      if (!process.env.SYMPY_API_KEY) {
        return NextResponse.json(
          { error: 'Symbolic compute service is not configured.', isConfigError: true },
          { status: 503 }
        );
      }

      const result = await computeSymbolic(validation.data);

      return NextResponse.json(
        { success: true, ...result },
        { headers: rateLimitHeaders }
      );
    }
  } catch (error) {
    console.error('Symbolic compute error:', error);

    const message = error instanceof Error ? error.message : 'An error occurred';
    const isServiceError = message.includes('SymPy');

    return NextResponse.json(
      {
        error: isServiceError
          ? 'Symbolic compute service is temporarily unavailable. Please try again later.'
          : 'Failed to process computation. Please try again.',
      },
      { status: isServiceError ? 503 : 500, headers: rateLimitHeaders }
    );
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
