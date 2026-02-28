import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export interface MolecularTarget {
  id: string;
  target_name: string;
  gene_name?: string;
  uniprot_id?: string;
  score?: number;
  evidence_type?: string[];
  source_db?: string;
}

export interface MolecularTargetsResponse {
  targets: MolecularTarget[];
  count: number;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: herbId } = await params;

  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`herb:targets:${identifier}`, RATE_LIMITS.api);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    const drupalUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL;

    const res = await fetch(
      `${drupalUrl}/jsonapi/node/tcm_target_interaction` +
      `?filter[field_herb_ref.id]=${herbId}` +
      `&page[limit]=50` +
      `&fields[node--tcm_target_interaction]=title,field_target_name,field_gene_name,field_uniprot_id,field_score,field_evidence_type,field_source_db` +
      `&sort=-field_score`,
      {
        headers: { 'Accept': 'application/vnd.api+json' },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { targets: [], count: 0 },
        { headers: rateLimitHeaders }
      );
    }

    const json = await res.json();
    const items: any[] = json.data || [];

    const targets: MolecularTarget[] = items.map((item: any) => ({
      id: item.id,
      target_name: item.attributes?.field_target_name || item.attributes?.title || 'Unknown Target',
      gene_name: item.attributes?.field_gene_name || undefined,
      uniprot_id: item.attributes?.field_uniprot_id || undefined,
      score: item.attributes?.field_score ? parseFloat(item.attributes.field_score) : undefined,
      evidence_type: item.attributes?.field_evidence_type
        ? (Array.isArray(item.attributes.field_evidence_type)
            ? item.attributes.field_evidence_type
            : [item.attributes.field_evidence_type])
        : undefined,
      source_db: item.attributes?.field_source_db || undefined,
    }));

    return NextResponse.json(
      { targets, count: targets.length } satisfies MolecularTargetsResponse,
      {
        headers: {
          ...rateLimitHeaders,
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching molecular targets:', error);
    return NextResponse.json(
      { targets: [], count: 0, error: 'Failed to fetch molecular targets' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
