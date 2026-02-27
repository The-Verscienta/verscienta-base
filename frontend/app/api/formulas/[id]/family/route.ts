import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export interface FormulaFamilyMember {
  id: string;
  title: string;
  modification_notes?: string;
}

export interface FormulaFamilyResponse {
  parent: FormulaFamilyMember | null;
  children: FormulaFamilyMember[];
  /** Modification notes on the current formula (explains how it differs from parent) */
  modification_notes?: string;
}

function getTextValue(field: any): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.value || '';
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: formulaId } = await params;

  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`formula:family:${identifier}`, RATE_LIMITS.api);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    const drupalUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL;

    // Fetch the current formula to get its parent reference and modification notes
    const formulaRes = await fetch(
      `${drupalUrl}/jsonapi/node/formula/${formulaId}` +
      `?fields[node--formula]=title,field_modification_notes,field_parent_formula` +
      `&include=field_parent_formula`,
      {
        headers: { 'Accept': 'application/vnd.api+json' },
        next: { revalidate: 300 },
      }
    );

    let parent: FormulaFamilyMember | null = null;
    let modification_notes = '';

    if (formulaRes.ok) {
      const formulaData = await formulaRes.json();
      const parentRef = formulaData.data?.relationships?.field_parent_formula?.data;
      modification_notes = getTextValue(formulaData.data?.attributes?.field_modification_notes);

      if (parentRef) {
        const included = formulaData.included || [];
        const parentNode = included.find((item: any) => item.id === parentRef.id);
        parent = {
          id: parentRef.id,
          title: parentNode?.attributes?.title || 'Parent Formula',
        };
      }
    }

    // Fetch children: all published formulas that reference this formula as their parent
    const childrenRes = await fetch(
      `${drupalUrl}/jsonapi/node/formula` +
      `?filter[field_parent_formula.id][value]=${formulaId}` +
      `&filter[status][value]=1` +
      `&fields[node--formula]=title,field_modification_notes` +
      `&sort=title`,
      {
        headers: { 'Accept': 'application/vnd.api+json' },
        next: { revalidate: 300 },
      }
    );

    let children: FormulaFamilyMember[] = [];

    if (childrenRes.ok) {
      const childrenData = await childrenRes.json();
      children = (childrenData.data || []).map((child: any) => ({
        id: child.id,
        title: child.attributes?.title || 'Formula',
        modification_notes: getTextValue(child.attributes?.field_modification_notes) || undefined,
      }));
    }

    const response: FormulaFamilyResponse = {
      parent,
      children,
      modification_notes: modification_notes || undefined,
    };

    return NextResponse.json(response, {
      headers: {
        ...rateLimitHeaders,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching formula family:', error);
    return NextResponse.json(
      { parent: null, children: [], error: 'Failed to fetch formula family' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
