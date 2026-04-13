import { NextRequest, NextResponse } from 'next/server';
import { analyzeSymptoms } from '@/lib/grok';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';
import { validateCsrfToken } from '@/lib/csrf';
import { symptomAnalysisSchema, formatZodErrors } from '@/lib/validation';

export async function POST(request: NextRequest) {
  // Validate CSRF token
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: 'Invalid request. Please refresh the page and try again.' },
      { status: 403 }
    );
  }

  // Apply rate limiting for AI endpoints
  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`grok:analysis:${identifier}`, RATE_LIMITS.ai);
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

    // Validate with Zod schema
    const validation = symptomAnalysisSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const { symptoms, followUpAnswers, context } = validation.data;

    // Check for XAI API key
    if (!process.env.XAI_API_KEY) {
      return NextResponse.json(
        {
          error: 'AI service is not configured. Please contact support.',
          isConfigError: true
        },
        { status: 503 }
      );
    }

    // Call Grok AI
    const analysis = await analyzeSymptoms({
      symptoms: symptoms.trim(),
      followUpAnswers,
      context,
    });

    // Log anonymized request (for analytics, dev only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Symptom analysis completed:', {
        timestamp: new Date().toISOString(),
        symptomsLength: symptoms.length,
        hasFollowUps: !!followUpAnswers,
        hasContext: !!context,
      });
    }

    return NextResponse.json(
      {
        success: true,
        ...analysis,
      },
      { headers: rateLimitHeaders }
    );

  } catch (error) {
    console.error('Symptom analysis error:', error);

    // Don't expose internal errors to client
    const message = error instanceof Error ? error.message : 'An error occurred';
    const isAPIError = message.includes('xAI API error');

    return NextResponse.json(
      {
        error: isAPIError
          ? 'AI service is temporarily unavailable. Please try again later.'
          : 'Failed to analyze symptoms. Please try again.',
      },
      { status: isAPIError ? 503 : 500, headers: rateLimitHeaders }
    );
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://verscienta.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
