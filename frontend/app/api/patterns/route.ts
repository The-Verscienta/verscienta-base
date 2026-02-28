/**
 * GET /api/patterns
 * TCM patterns listing with pagination and organ system filter.
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
  createRateLimitHeaders,
} from '@/lib/rate-limit';
import type { TcmPatternListItem } from '@/types/drupal';

const DRUPAL_BASE = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL ?? '';

function mapPattern(item: Record<string, unknown>): TcmPatternListItem & { _organSystemId?: string } {
  const attrs = (item.attributes as Record<string, unknown>) ?? {};
  const rels = (item.relationships as Record<string, unknown>) ?? {};
  const organData = (rels.field_organ_system as Record<string, unknown>)?.data as Record<string, unknown> | null;

  return {
    id: item.id as string,
    title: (attrs.title as string) ?? '',
    chineseName: (attrs.field_pattern_name_chinese as string) || undefined,
    pinyinName: (attrs.field_pattern_name_pinyin as string) || undefined,
    category: (attrs.field_pattern_category as TcmPatternListItem['category']) || undefined,
    temperature: (attrs.field_temperature as TcmPatternListItem['temperature']) || undefined,
    popularity: (attrs.field_popularity as string) || undefined,
    editorsPick: (attrs.field_editors_pick as boolean) || false,
    _organSystemId: organData?.id as string | undefined,
  };
}

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`patterns:list:${identifier}`, RATE_LIMITS.api);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(50, parseInt(searchParams.get('pageSize') ?? '12', 10));
  const sort = searchParams.get('sort') ?? 'title';
  const organSystem = searchParams.get('organSystem') ?? '';
  const offset = (page - 1) * pageSize;

  const listParams = new URLSearchParams({
    sort,
    'page[limit]': String(pageSize),
    'page[offset]': String(offset),
    'filter[status]': '1',
    'fields[node--tcm_pattern]':
      'id,title,field_pattern_name_chinese,field_pattern_name_pinyin,' +
      'field_organ_system,field_pattern_category,field_temperature,field_popularity,field_editors_pick',
    include: 'field_organ_system',
    'fields[taxonomy_term--organ_system]': 'id,name',
  });
  if (organSystem) listParams.set('filter[field_organ_system.name]', organSystem);

  const countParams = new URLSearchParams({
    'filter[status]': '1',
    'fields[node--tcm_pattern]': 'id',
    'page[limit]': '500',
  });
  if (organSystem) countParams.set('filter[field_organ_system.name]', organSystem);

  try {
    const [listRes, countRes] = await Promise.all([
      fetch(`${DRUPAL_BASE}/jsonapi/node/tcm_pattern?${listParams}`, {
        headers: { Accept: 'application/vnd.api+json' },
        next: { revalidate: 300 },
      }),
      fetch(`${DRUPAL_BASE}/jsonapi/node/tcm_pattern?${countParams}`, {
        headers: { Accept: 'application/vnd.api+json' },
        next: { revalidate: 300 },
      }),
    ]);

    if (!listRes.ok) {
      return NextResponse.json(
        { patterns: [], total: 0 },
        { headers: rateLimitHeaders }
      );
    }

    const listJson = await listRes.json();
    const countJson = countRes.ok ? await countRes.json() : { data: [] };

    // Build organ system name lookup from included
    const organNames: Record<string, string> = {};
    for (const inc of listJson.included ?? []) {
      if (inc.type === 'taxonomy_term--organ_system') {
        organNames[inc.id] = inc.attributes?.name ?? '';
      }
    }

    const patterns = (listJson.data ?? []).map((item: Record<string, unknown>) => {
      const raw = mapPattern(item);
      const oId = raw._organSystemId;
      const { _organSystemId: _unused, ...mapped } = raw;
      void _unused;
      if (oId && organNames[oId]) {
        (mapped as TcmPatternListItem).organSystem = organNames[oId];
      }
      return mapped as TcmPatternListItem;
    });

    return NextResponse.json(
      { patterns, total: (countJson.data ?? []).length, page, pageSize },
      {
        headers: {
          ...rateLimitHeaders,
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching TCM patterns:', error);
    return NextResponse.json(
      { patterns: [], total: 0, error: 'Failed to fetch patterns' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
