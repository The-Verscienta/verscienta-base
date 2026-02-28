/**
 * GET /api/concepts
 * TCM concepts listing with pagination and category filter.
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
  createRateLimitHeaders,
} from '@/lib/rate-limit';
import type { TcmConceptListItem } from '@/types/drupal';

const DRUPAL_BASE = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL ?? '';

function mapConcept(item: Record<string, unknown>): TcmConceptListItem & { _categoryId?: string } {
  const attrs = (item.attributes as Record<string, unknown>) ?? {};
  const rels = (item.relationships as Record<string, unknown>) ?? {};
  const categoryData = (rels.field_concept_category as Record<string, unknown>)?.data as Record<string, unknown> | null;

  return {
    id: item.id as string,
    title: (attrs.title as string) ?? '',
    chineseName: (attrs.field_concept_chinese_name as string) || undefined,
    pinyinName: (attrs.field_concept_pinyin_name as string) || undefined,
    popularity: (attrs.field_popularity as string) || undefined,
    editorsPick: (attrs.field_editors_pick as boolean) || false,
    _categoryId: categoryData?.id as string | undefined,
  };
}

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`concepts:list:${identifier}`, RATE_LIMITS.api);
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
  const category = searchParams.get('category') ?? '';
  const offset = (page - 1) * pageSize;

  const listParams = new URLSearchParams({
    sort,
    'page[limit]': String(pageSize),
    'page[offset]': String(offset),
    'filter[status]': '1',
    'fields[node--tcm_concept]':
      'id,title,field_concept_chinese_name,field_concept_pinyin_name,' +
      'field_concept_category,field_popularity,field_editors_pick',
    include: 'field_concept_category',
    'fields[taxonomy_term--concept_category]': 'id,name',
  });
  if (category) listParams.set('filter[field_concept_category.name]', category);

  const countParams = new URLSearchParams({
    'filter[status]': '1',
    'fields[node--tcm_concept]': 'id',
    'page[limit]': '500',
  });
  if (category) countParams.set('filter[field_concept_category.name]', category);

  try {
    const [listRes, countRes] = await Promise.all([
      fetch(`${DRUPAL_BASE}/jsonapi/node/tcm_concept?${listParams}`, {
        headers: { Accept: 'application/vnd.api+json' },
        next: { revalidate: 300 },
      }),
      fetch(`${DRUPAL_BASE}/jsonapi/node/tcm_concept?${countParams}`, {
        headers: { Accept: 'application/vnd.api+json' },
        next: { revalidate: 300 },
      }),
    ]);

    if (!listRes.ok) {
      return NextResponse.json(
        { concepts: [], total: 0 },
        { headers: rateLimitHeaders }
      );
    }

    const listJson = await listRes.json();
    const countJson = countRes.ok ? await countRes.json() : { data: [] };

    // Build category name lookup from included
    const categoryNames: Record<string, string> = {};
    for (const inc of listJson.included ?? []) {
      if (inc.type === 'taxonomy_term--concept_category') {
        categoryNames[inc.id] = inc.attributes?.name ?? '';
      }
    }

    const concepts = (listJson.data ?? []).map((item: Record<string, unknown>) => {
      const raw = mapConcept(item);
      const catId = raw._categoryId;
      const { _categoryId: _unused, ...mapped } = raw;
      void _unused;
      if (catId && categoryNames[catId]) {
        (mapped as TcmConceptListItem).category = categoryNames[catId];
      }
      return mapped as TcmConceptListItem;
    });

    return NextResponse.json(
      { concepts, total: (countJson.data ?? []).length, page, pageSize },
      {
        headers: {
          ...rateLimitHeaders,
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching TCM concepts:', error);
    return NextResponse.json(
      { concepts: [], total: 0, error: 'Failed to fetch concepts' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
