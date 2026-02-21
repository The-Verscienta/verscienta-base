import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';
import { formulaContributionSchema, formatZodErrors } from '@/lib/validation';
import { validateCsrfToken } from '@/lib/csrf';
import { cachedFetch, memoryCache, CACHE_TTL } from '@/lib/cache';
import type { FormulaContribution } from '@/types/drupal';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET: Fetch approved contributions for a formula
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: formulaId } = await params;

  // Apply rate limiting
  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`formula:contributions:get:${identifier}`, RATE_LIMITS.api);
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
    const cacheKey = `contributions:${formulaId}`;

    // Use cached fetch for contributions
    const contributions = await cachedFetch(cacheKey, async () => {
      const drupalUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL;

      const filterParams = new URLSearchParams({
        'filter[status][value]': '1',
        'filter[field_formula_reference.id]': formulaId,
        'filter[field_contribution_status]': 'approved',
        'include': 'uid',
        'sort': '-created',
      });

      const response = await fetch(
        `${drupalUrl}/jsonapi/node/formula_contribution?${filterParams.toString()}`,
        {
          headers: {
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        console.error('Failed to fetch contributions:', response.status);
        return [];
      }

      const data = await response.json();

      return (data.data || []).map((item: any) => {
        const userId = item.relationships?.uid?.data?.id;
        const userData = data.included?.find(
          (inc: any) => inc.type === 'user--user' && inc.id === userId
        );

        // Handle text fields that may be objects with value/format/processed
        const clinicalNote = item.attributes?.field_clinical_note;
        const context = item.attributes?.field_context;
        const modifications = item.attributes?.field_modifications;

        return {
          id: item.id,
          type: item.type,
          title: item.attributes?.title || '',
          status: true,
          langcode: item.attributes?.langcode || 'en',
          created: item.attributes?.created,
          changed: item.attributes?.changed,
          path: item.attributes?.path || { alias: '', langcode: 'en' },
          field_contribution_type: item.attributes?.field_contribution_type,
          field_formula_reference: { id: formulaId, type: 'node--formula' },
          field_status: item.attributes?.field_contribution_status || 'approved',
          field_clinical_note: typeof clinicalNote === 'object' ? clinicalNote?.value : clinicalNote,
          field_context: typeof context === 'object' ? context?.value : context,
          field_modifications: modifications
            ? (typeof modifications === 'object' && modifications?.value
                ? JSON.parse(modifications.value)
                : (typeof modifications === 'string' ? JSON.parse(modifications) : modifications))
            : undefined,
          uid: {
            id: userId || '',
            name: userData?.attributes?.name || 'Anonymous',
          },
        };
      });
    }, CACHE_TTL.CONTRIBUTIONS);

    // Add cache headers for CDN/browser caching
    const cacheHeaders = {
      ...rateLimitHeaders,
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    };

    return NextResponse.json({ contributions }, { headers: cacheHeaders });
  } catch (error: any) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json(
      { contributions: [], error: 'Failed to fetch contributions' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}

// POST: Submit a new contribution (requires authentication)
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Validate CSRF token
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: 'Invalid request. Please refresh the page and try again.' },
      { status: 403 }
    );
  }

  const { id: formulaId } = await params;

  // Apply rate limiting
  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`formula:contributions:post:${identifier}`, RATE_LIMITS.api);
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
        { error: 'Authentication required. Please log in to submit contributions.' },
        { status: 401, headers: rateLimitHeaders }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Override formula_id with the URL parameter for security
    body.formula_id = formulaId;

    const validationResult = formulaContributionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: formatZodErrors(validationResult.error),
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const contributionData = validationResult.data;
    const drupalUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL;

    // Create the contribution node in Drupal
    const createPayload = {
      data: {
        type: 'node--formula_contribution',
        attributes: {
          title: `Contribution for ${formulaId}`,
          status: false, // Unpublished by default (pending approval)
          field_contribution_type: contributionData.contribution_type,
          field_status: 'pending',
          field_clinical_note: contributionData.clinical_note || null,
          field_context: contributionData.context || null,
          field_modifications: contributionData.modifications
            ? JSON.stringify(contributionData.modifications)
            : null,
        },
        relationships: {
          field_formula_reference: {
            data: {
              type: 'node--formula',
              id: formulaId,
            },
          },
        },
      },
    };

    const response = await fetch(`${drupalUrl}/jsonapi/node/formula_contribution`, {
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
      console.error('Failed to create contribution:', errorData);

      // Handle specific error cases
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'You do not have permission to submit contributions.' },
          { status: 403, headers: rateLimitHeaders }
        );
      }

      if (response.status === 404) {
        return NextResponse.json(
          { error: 'The formula_contribution content type may not be configured in Drupal.' },
          { status: 404, headers: rateLimitHeaders }
        );
      }

      return NextResponse.json(
        { error: errorData.errors?.[0]?.detail || 'Failed to submit contribution' },
        { status: response.status, headers: rateLimitHeaders }
      );
    }

    const createdContribution = await response.json();

    return NextResponse.json(
      {
        success: true,
        message: 'Your contribution has been submitted and is pending admin approval.',
        contribution: {
          id: createdContribution.data.id,
          status: 'pending',
        },
      },
      { status: 201, headers: rateLimitHeaders }
    );
  } catch (error: any) {
    console.error('Error creating contribution:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while submitting your contribution' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
