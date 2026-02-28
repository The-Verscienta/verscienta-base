/**
 * GET /api/points
 * Acupuncture points listing with pagination and meridian filter.
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
  createRateLimitHeaders,
} from '@/lib/rate-limit';
import type { AcupointListItem } from '@/types/drupal';

const DRUPAL_BASE = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL ?? '';

function mapPoint(item: Record<string, unknown>): AcupointListItem {
  const attrs = (item.attributes as Record<string, unknown>) ?? {};
  const rels = (item.relationships as Record<string, unknown>) ?? {};
  const meridianData = (rels.field_meridian as Record<string, unknown>)?.data as Record<string, unknown> | null;

  return {
    id: item.id as string,
    title: (attrs.title as string) ?? '',
    pointCode: (attrs.field_point_code as string) ?? '',
    pinyinName: (attrs.field_point_pinyin_name as string) || undefined,
    chineseName: (attrs.field_point_chinese_name as string) || undefined,
    meridianName: meridianData
      ? undefined  // resolved from included below
      : undefined,
    specialProperties: (attrs.field_special_properties as string[]) || [],
    popularity: (attrs.field_popularity as string) || undefined,
    editorsPick: (attrs.field_editors_pick as boolean) || false,
    beginnerFriendly: (attrs.field_beginner_friendly as boolean) || false,
    _meridianId: meridianData?.id as string | undefined,
  } as AcupointListItem & { _meridianId?: string };
}

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`points:list:${identifier}`, RATE_LIMITS.api);
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
  const meridian = searchParams.get('meridian') ?? '';
  const offset = (page - 1) * pageSize;

  const listParams = new URLSearchParams({
    sort,
    'page[limit]': String(pageSize),
    'page[offset]': String(offset),
    'filter[status]': '1',
    'fields[node--acupuncture_point]':
      'id,title,field_point_code,field_point_pinyin_name,field_point_chinese_name,' +
      'field_meridian,field_special_properties,field_popularity,field_editors_pick,field_beginner_friendly',
    include: 'field_meridian',
    'fields[taxonomy_term--meridian]': 'id,name',
  });
  if (meridian) listParams.set('filter[field_meridian.name]', meridian);

  const countParams = new URLSearchParams({
    'filter[status]': '1',
    'fields[node--acupuncture_point]': 'id',
    'page[limit]': '500',
  });
  if (meridian) countParams.set('filter[field_meridian.name]', meridian);

  try {
    const [listRes, countRes] = await Promise.all([
      fetch(`${DRUPAL_BASE}/jsonapi/node/acupuncture_point?${listParams}`, {
        headers: { Accept: 'application/vnd.api+json' },
        next: { revalidate: 300 },
      }),
      fetch(`${DRUPAL_BASE}/jsonapi/node/acupuncture_point?${countParams}`, {
        headers: { Accept: 'application/vnd.api+json' },
        next: { revalidate: 300 },
      }),
    ]);

    if (!listRes.ok) {
      return NextResponse.json(
        { points: [], total: 0 },
        { headers: rateLimitHeaders }
      );
    }

    const listJson = await listRes.json();
    const countJson = countRes.ok ? await countRes.json() : { data: [] };

    // Build meridian name lookup from included
    const meridianNames: Record<string, string> = {};
    for (const inc of listJson.included ?? []) {
      if (inc.type === 'taxonomy_term--meridian') {
        meridianNames[inc.id] = inc.attributes?.name ?? '';
      }
    }

    const points = (listJson.data ?? []).map((item: Record<string, unknown>) => {
      const raw = mapPoint(item) as AcupointListItem & { _meridianId?: string };
      const mId = raw._meridianId;
      const { _meridianId: _unused, ...mapped } = raw;
      void _unused;
      if (mId && meridianNames[mId]) {
        (mapped as AcupointListItem).meridianName = meridianNames[mId];
      }
      return mapped as AcupointListItem;
    });

    return NextResponse.json(
      { points, total: (countJson.data ?? []).length, page, pageSize },
      {
        headers: {
          ...rateLimitHeaders,
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching acupuncture points:', error);
    return NextResponse.json(
      { points: [], total: 0, error: 'Failed to fetch points' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
