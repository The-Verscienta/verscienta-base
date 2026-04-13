/**
 * GET /api/formulas
 * Lightweight formula list for client-side title matching (e.g. symptom checker deep links).
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
  createRateLimitHeaders,
} from '@/lib/rate-limit';

const DRUPAL_BASE = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL ?? '';

const PAGE_LIMIT = 100;
const MAX_FORMULAS = 2000;

export interface FormulaListItem {
  id: string;
  title: string;
  chineseName?: string;
  pinyinName?: string;
}

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`formulas:list:${identifier}`, RATE_LIMITS.api);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  const formulas: FormulaListItem[] = [];
  let offset = 0;

  /** Prefer extra name fields when present; fall back to id+title only if JSON:API rejects unknown fields. */
  const fieldsets = [
    'id,title,field_chinese_name,field_pinyin_name',
    'id,title',
  ] as const;

  try {
    let activeFields: string = fieldsets[0];
    while (formulas.length < MAX_FORMULAS) {
      const listParams = new URLSearchParams({
        sort: 'title',
        'page[limit]': String(PAGE_LIMIT),
        'page[offset]': String(offset),
        'filter[status]': '1',
        'fields[node--formula]': activeFields,
      });

      const listRes = await fetch(`${DRUPAL_BASE}/jsonapi/node/formula?${listParams}`, {
        headers: { Accept: 'application/vnd.api+json' },
        next: { revalidate: 300 },
      });

      if (!listRes.ok) {
        if (offset === 0 && activeFields === fieldsets[0]) {
          activeFields = fieldsets[1];
          continue;
        }
        if (offset === 0) {
          return NextResponse.json(
            { formulas: [], total: 0 },
            { headers: rateLimitHeaders }
          );
        }
        break;
      }

      const listJson = await listRes.json();
      const batch = (listJson.data ?? []) as Record<string, unknown>[];

      for (const item of batch) {
        const attrs = (item.attributes as Record<string, unknown>) ?? {};
        formulas.push({
          id: item.id as string,
          title: (attrs.title as string) ?? '',
          chineseName: (attrs.field_chinese_name as string) || undefined,
          pinyinName: (attrs.field_pinyin_name as string) || undefined,
        });
      }

      if (batch.length < PAGE_LIMIT) break;
      offset += PAGE_LIMIT;
    }

    const total = formulas.length;

    return NextResponse.json(
      { formulas, total },
      {
        headers: {
          ...rateLimitHeaders,
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching formulas list:', error);
    return NextResponse.json(
      { formulas: [], total: 0, error: 'Failed to fetch formulas' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
