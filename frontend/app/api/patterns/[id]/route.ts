/**
 * GET /api/patterns/[id]
 * Single TCM pattern detail.
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
  'id', 'title', 'body',
  'field_pattern_name_chinese', 'field_pattern_name_pinyin',
  'field_organ_system',
  'field_etiology', 'field_pathomechanism', 'field_signs_symptoms',
  'field_tongue_criteria', 'field_pulse_criteria',
  'field_treatment_principle', 'field_differential_diagnosis',
  'field_pattern_category', 'field_temperature',
  'field_related_formulas', 'field_related_herbs',
  'field_related_points', 'field_related_conditions',
  'field_popularity', 'field_editors_pick',
].join(',');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`pattern:detail:${identifier}`, RATE_LIMITS.api);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  const queryParams = new URLSearchParams({
    'fields[node--tcm_pattern]': FIELDS,
    include:
      'field_organ_system,field_related_conditions,field_related_herbs,field_related_formulas,field_related_points',
    'fields[taxonomy_term--organ_system]': 'id,name,description',
    'fields[node--condition]': 'id,title',
    'fields[node--herb]': 'id,title,field_herb_pinyin_name',
    'fields[node--formula]': 'id,title',
    'fields[node--acupuncture_point]': 'id,title,field_point_code',
  });

  try {
    const res = await fetch(
      `${DRUPAL_BASE}/jsonapi/node/tcm_pattern/${id}?${queryParams}`,
      {
        headers: { Accept: 'application/vnd.api+json' },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { pattern: null },
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

    const pattern = {
      id: json.data.id,
      type: json.data.type,
      ...attrs,
      field_organ_system: resolveRef(rels.field_organ_system),
      field_related_conditions: resolveRefs(rels.field_related_conditions),
      field_related_herbs: resolveRefs(rels.field_related_herbs),
      field_related_formulas: resolveRefs(rels.field_related_formulas),
      field_related_points: resolveRefs(rels.field_related_points),
    };

    return NextResponse.json(
      { pattern },
      {
        headers: {
          ...rateLimitHeaders,
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching TCM pattern detail:', error);
    return NextResponse.json(
      { pattern: null, error: 'Failed to fetch pattern' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
