import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: 'current' | 'related';
}

export interface NetworkLink {
  source: string;
  target: string;
  label: string;
}

export interface FormulaNetworkResponse {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: formulaId } = await params;

  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`formula:network:${identifier}`, RATE_LIMITS.api);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    const drupalUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL;

    // Step 1: Fetch the current formula's title and herb ingredient IDs
    const formulaRes = await fetch(
      `${drupalUrl}/jsonapi/node/formula/${formulaId}` +
      `?fields[node--formula]=title,field_herb_ingredients` +
      `&include=field_herb_ingredients,field_herb_ingredients.field_herb_reference` +
      `&fields[paragraph--herb_ingredient]=field_herb_reference` +
      `&fields[node--herb]=title`,
      {
        headers: { 'Accept': 'application/vnd.api+json' },
        next: { revalidate: 300 },
      }
    );

    if (!formulaRes.ok) {
      return NextResponse.json({ nodes: [], links: [] }, { headers: rateLimitHeaders });
    }

    const formulaData = await formulaRes.json();
    const formulaTitle = formulaData.data?.attributes?.title || 'This Formula';

    // Build herb id → name map from included
    const included: any[] = formulaData.included || [];
    const herbMap = new Map<string, string>();
    for (const item of included) {
      if (item.type === 'node--herb') {
        herbMap.set(item.id, item.attributes?.title || 'Herb');
      }
    }

    // Get herb IDs from paragraph relationships
    const ingredientRefs: any[] = formulaData.data?.relationships?.field_herb_ingredients?.data || [];
    const herbIds: string[] = [];
    for (const ref of ingredientRefs) {
      const para = included.find((i: any) => i.id === ref.id);
      const herbRef = para?.relationships?.field_herb_reference?.data;
      if (herbRef?.id) herbIds.push(herbRef.id);
    }

    if (herbIds.length === 0) {
      return NextResponse.json({ nodes: [], links: [] }, { headers: rateLimitHeaders });
    }

    // Step 2: For each herb, fetch other formulas that contain it (max 5 per herb)
    const relatedFormulas = new Map<string, { title: string; herbs: string[] }>();

    await Promise.all(
      herbIds.slice(0, 10).map(async (herbId) => {
        const herbName = herbMap.get(herbId) || 'Herb';
        try {
          const res = await fetch(
            `${drupalUrl}/jsonapi/node/formula` +
            `?filter[field_herb_ingredients.field_herb_reference.id]=${herbId}` +
            `&filter[status][value]=1` +
            `&fields[node--formula]=title` +
            `&page[limit]=6`,
            {
              headers: { 'Accept': 'application/vnd.api+json' },
              next: { revalidate: 300 },
            }
          );
          if (!res.ok) return;
          const data = await res.json();
          for (const formula of (data.data || [])) {
            if (formula.id === formulaId) continue;
            if (!relatedFormulas.has(formula.id)) {
              relatedFormulas.set(formula.id, { title: formula.attributes?.title || 'Formula', herbs: [] });
            }
            relatedFormulas.get(formula.id)!.herbs.push(herbName);
          }
        } catch {
          // Ignore per-herb fetch errors
        }
      })
    );

    // Limit to top 20 most-connected related formulas
    const sortedRelated = [...relatedFormulas.entries()]
      .sort((a, b) => b[1].herbs.length - a[1].herbs.length)
      .slice(0, 20);

    if (sortedRelated.length < 2) {
      return NextResponse.json({ nodes: [], links: [] }, { headers: rateLimitHeaders });
    }

    // Build graph data
    const nodes: NetworkNode[] = [
      { id: formulaId, label: formulaTitle, type: 'current' },
      ...sortedRelated.map(([id, { title }]) => ({ id, label: title, type: 'related' as const })),
    ];

    const links: NetworkLink[] = sortedRelated.map(([id, { herbs }]) => ({
      source: formulaId,
      target: id,
      label: herbs.slice(0, 2).join(', '),
    }));

    return NextResponse.json(
      { nodes, links } satisfies FormulaNetworkResponse,
      {
        headers: {
          ...rateLimitHeaders,
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching formula network:', error);
    return NextResponse.json(
      { nodes: [], links: [], error: 'Failed to fetch formula network' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
