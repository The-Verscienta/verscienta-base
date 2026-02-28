/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

const originalFetch = global.fetch;

beforeAll(() => { global.fetch = jest.fn(); });
afterAll(() => { global.fetch = originalFetch; });

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({
    success: true, remaining: 10, reset: Date.now() + 60000, retryAfter: 0,
  }),
  getClientIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
  RATE_LIMITS: { api: { interval: 60000, maxRequests: 60 } },
  createRateLimitHeaders: jest.fn().mockReturnValue({}),
}));

import { GET } from '@/app/api/concepts/route';
import { checkRateLimit } from '@/lib/rate-limit';

function makeReq(query = '') {
  return new NextRequest(`http://localhost/api/concepts${query ? '?' + query : ''}`, { method: 'GET' });
}

const DRUPAL_RESPONSE = {
  data: [
    {
      id: 'con-1',
      type: 'node--tcm_concept',
      attributes: {
        title: 'Qi',
        field_concept_chinese_name: '气',
        field_concept_pinyin_name: 'Qì',
        field_popularity: 'staple',
        field_editors_pick: true,
      },
      relationships: {
        field_concept_category: { data: { id: 'cat-1', type: 'taxonomy_term--concept_category' } },
      },
    },
  ],
  included: [
    {
      id: 'cat-1',
      type: 'taxonomy_term--concept_category',
      attributes: { name: 'Fundamental Substances' },
    },
  ],
};

describe('GET /api/concepts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: true, remaining: 10, reset: Date.now() + 60000, retryAfter: 0,
    });
  });

  it('returns empty list when Drupal returns non-ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    const res = await GET(makeReq());
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.concepts).toEqual([]);
    expect(data.total).toBe(0);
  });

  it('returns formatted concepts with resolved category name', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => DRUPAL_RESPONSE,
    });
    const res = await GET(makeReq());
    const data = await res.json();
    expect(data.concepts).toHaveLength(1);
    const con = data.concepts[0];
    expect(con.id).toBe('con-1');
    expect(con.title).toBe('Qi');
    expect(con.chineseName).toBe('气');
    expect(con.pinyinName).toBe('Qì');
    expect(con.category).toBe('Fundamental Substances');
    expect(con.popularity).toBe('staple');
    expect(con.editorsPick).toBe(true);
    // Internal _categoryId should not leak
    expect((con as Record<string, unknown>)._categoryId).toBeUndefined();
  });

  it('includes page and pageSize in response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], included: [] }),
    });
    const res = await GET(makeReq('page=2&pageSize=6'));
    const data = await res.json();
    expect(data.page).toBe(2);
    expect(data.pageSize).toBe(6);
  });

  it('returns 429 when rate limited', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false, remaining: 0, reset: Date.now() + 60000, retryAfter: 30,
    });
    const res = await GET(makeReq());
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toMatch(/too many requests/i);
  });

  it('returns 500 on fetch error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network error'));
    const res = await GET(makeReq());
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.concepts).toEqual([]);
  });
});
