import { NextRequest, NextResponse } from 'next/server';
import { generateFollowUpQuestions } from '@/lib/grok';
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

  // Apply rate limiting for AI endpoints
  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`grok:followups:${identifier}`, RATE_LIMITS.ai);
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
    const { symptoms, previousAnswers } = body;

    if (!symptoms || typeof symptoms !== 'string') {
      return NextResponse.json(
        { error: 'Symptoms are required' },
        { status: 400 }
      );
    }

    if (!process.env.XAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service is not configured' },
        { status: 503 }
      );
    }

    const questions = await generateFollowUpQuestions(
      symptoms.trim(),
      previousAnswers
    );

    return NextResponse.json(
      {
        success: true,
        questions,
      },
      { headers: rateLimitHeaders }
    );

  } catch (error) {
    console.error('Follow-up questions error:', error);

    return NextResponse.json(
      { error: 'Failed to generate follow-up questions' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
