/**
 * GET /api/points/[id]
 * Single acupuncture point detail.
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
  createRateLimitHeaders,
} from '@/lib/rate-limit';

const DRUPAL_BASE = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL ?? '';

const FIELDS = [
  'id', 'title',
  'field_point_code', 'field_point_chinese_name', 'field_point_pinyin_name',
  'field_location_description', 'field_location_anatomical',
  'field_needling_depth', 'field_needling_angle', 'field_needling_method',
  'field_moxa_suitable', 'field_moxa_cones', 'field_press_needle_suitable',
  'field_actions', 'field_indications', 'field_contraindications',
  'field_classical_notes', 'field_clinical_notes', 'field_combinations',
  'field_special_properties', 'field_five_element',
  'field_meridian', 'field_meridian_number',
  'field_related_conditions', 'field_related_herbs', 'field_related_formulas',
  'field_popularity', 'field_editors_pick', 'field_beginner_friendly',
  'body',
].join(',');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`point:detail:${identifier}`, RATE_LIMITS.api);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  const queryParams = new URLSearchParams({
    'fields[node--acupuncture_point]': FIELDS,
    include:
      'field_meridian,field_related_conditions,field_related_herbs,field_related_formulas',
    'fields[taxonomy_term--meridian]': 'id,name,description',
    'fields[node--condition]': 'id,title',
    'fields[node--herb]': 'id,title,field_herb_pinyin_name',
    'fields[node--formula]': 'id,title',
  });

  try {
    const res = await fetch(
      `${DRUPAL_BASE}/jsonapi/node/acupuncture_point/${id}?${queryParams}`,
      {
        headers: { Accept: 'application/vnd.api+json' },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { point: null },
        { status: res.status === 404 ? 404 : 502, headers: rateLimitHeaders }
      );
    }

    const json = await res.json();

    // Build lookup table for included entities
    const included: Record<string, Record<string, unknown>> = {};
    for (const inc of json.included ?? []) {
      included[inc.id] = inc;
    }

    function resolveRef(rel: Record<string, unknown> | null) {
      if (!rel) return null;
      const data = rel.data as { id: string; type: string } | null;
      if (!data) return null;
      const inc = included[data.id];
      return inc
        ? { id: data.id, type: data.type, ...(inc.attributes as Record<string, unknown>) }
        : { id: data.id, type: data.type };
    }

    function resolveRefs(rel: Record<string, unknown> | null) {
      if (!rel) return [];
      const data = rel.data as Array<{ id: string; type: string }>;
      return (data ?? []).map(d => {
        const inc = included[d.id];
        return inc
          ? { id: d.id, type: d.type, ...(inc.attributes as Record<string, unknown>) }
          : { id: d.id, type: d.type };
      });
    }

    const attrs = json.data.attributes ?? {};
    const rels = json.data.relationships ?? {};

    const point = {
      id: json.data.id,
      type: json.data.type,
      ...attrs,
      field_meridian: resolveRef(rels.field_meridian),
      field_related_conditions: resolveRefs(rels.field_related_conditions),
      field_related_herbs: resolveRefs(rels.field_related_herbs),
      field_related_formulas: resolveRefs(rels.field_related_formulas),
    };

    return NextResponse.json(
      { point },
      {
        headers: {
          ...rateLimitHeaders,
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching acupuncture point detail:', error);
    return NextResponse.json(
      { point: null, error: 'Failed to fetch point' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
