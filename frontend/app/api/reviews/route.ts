import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';
import { validateCsrfToken } from '@/lib/csrf';
import { reviewSchema, formatZodErrors } from '@/lib/validation';

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
  const rateLimitResult = checkRateLimit(`reviews:post:${identifier}`, RATE_LIMITS.api);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Please try again in ${rateLimitResult.retryAfter} seconds.`,
        retryAfter: rateLimitResult.retryAfter,
      },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    // Check authentication
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'You must be logged in to submit a review.' },
        { status: 401, headers: rateLimitHeaders }
      );
    }

    const body = await request.json();

    // Validate with Zod schema
    const validation = reviewSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: formatZodErrors(validation.error) },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const { rating, comment, reviewedEntityType, reviewedEntityId } = validation.data;
    const drupalUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL;

    // Map entity type to Drupal reference field
    const referenceFieldMap: Record<string, string> = {
      herb: 'field_reviewed_herb',
      modality: 'field_reviewed_modality',
      practitioner: 'field_reviewed_practitioner',
      formula: 'field_reviewed_formula',
    };

    const referenceField = referenceFieldMap[reviewedEntityType];
    if (!referenceField) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const createPayload = {
      data: {
        type: 'node--review',
        attributes: {
          title: `Review of ${reviewedEntityType}`,
          field_rating: rating,
          field_review_body: comment,
          field_verified: false,
          status: false, // Unpublished by default (pending moderation)
        },
        relationships: {
          [referenceField]: {
            data: {
              type: `node--${reviewedEntityType}`,
              id: reviewedEntityId,
            },
          },
        },
      },
    };

    const response = await fetch(`${drupalUrl}/jsonapi/node/review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
      body: JSON.stringify(createPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 403) {
        return NextResponse.json(
          { error: 'You do not have permission to submit reviews.' },
          { status: 403, headers: rateLimitHeaders }
        );
      }

      return NextResponse.json(
        { error: errorData.errors?.[0]?.detail || 'Failed to submit review' },
        { status: response.status, headers: rateLimitHeaders }
      );
    }

    const createdReview = await response.json();

    return NextResponse.json(
      {
        success: true,
        message: 'Your review has been submitted and is pending moderation.',
        review: {
          id: createdReview.data.id,
        },
      },
      { status: 201, headers: rateLimitHeaders }
    );
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while submitting your review' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
