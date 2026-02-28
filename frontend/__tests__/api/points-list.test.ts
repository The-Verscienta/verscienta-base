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

import { GET } from '@/app/api/points/route';
import { checkRateLimit } from '@/lib/rate-limit';

function makeReq(query = '') {
  return new NextRequest(`http://localhost/api/points${query ? '?' + query : ''}`, { method: 'GET' });
}

const DRUPAL_RESPONSE = {
  data: [
    {
      id: 'pt-1',
      type: 'node--acupuncture_point',
      attributes: {
        title: 'Broken Sequence',
        field_point_code: 'LU-7',
        field_point_pinyin_name: 'Lie Que',
        field_point_chinese_name: '列缺',
        field_special_properties: ['luo_connecting'],
        field_popularity: 'staple',
        field_editors_pick: true,
        field_beginner_friendly: true,
      },
      relationships: {
        field_meridian: { data: { id: 'mer-1', type: 'taxonomy_term--meridian' } },
      },
    },
  ],
  included: [
    {
      id: 'mer-1',
      type: 'taxonomy_term--meridian',
      attributes: { name: 'Lung' },
    },
  ],
};

describe('GET /api/points', () => {
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
    expect(data.points).toEqual([]);
    expect(data.total).toBe(0);
  });

  it('returns formatted points with resolved meridian name', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => DRUPAL_RESPONSE,
    });
    const res = await GET(makeReq());
    const data = await res.json();
    expect(data.points).toHaveLength(1);
    const pt = data.points[0];
    expect(pt.id).toBe('pt-1');
    expect(pt.pointCode).toBe('LU-7');
    expect(pt.pinyinName).toBe('Lie Que');
    expect(pt.chineseName).toBe('列缺');
    expect(pt.meridianName).toBe('Lung');
    expect(pt.specialProperties).toEqual(['luo_connecting']);
    expect(pt.popularity).toBe('staple');
    expect(pt.editorsPick).toBe(true);
    expect(pt.beginnerFriendly).toBe(true);
    // Internal _meridianId should not leak
    expect(pt._meridianId).toBeUndefined();
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
    expect(data.points).toEqual([]);
  });
});
