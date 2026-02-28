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

import { GET } from '@/app/api/patterns/route';
import { checkRateLimit } from '@/lib/rate-limit';

function makeReq(query = '') {
  return new NextRequest(`http://localhost/api/patterns${query ? '?' + query : ''}`, { method: 'GET' });
}

const DRUPAL_RESPONSE = {
  data: [
    {
      id: 'pat-1',
      type: 'node--tcm_pattern',
      attributes: {
        title: 'Spleen Qi Deficiency',
        field_pattern_name_chinese: '脾气虚',
        field_pattern_name_pinyin: 'Pí Qì Xū',
        field_pattern_category: 'deficiency',
        field_temperature: 'neutral',
        field_popularity: 'staple',
        field_editors_pick: true,
      },
      relationships: {
        field_organ_system: { data: { id: 'org-1', type: 'taxonomy_term--organ_system' } },
      },
    },
  ],
  included: [
    {
      id: 'org-1',
      type: 'taxonomy_term--organ_system',
      attributes: { name: 'Spleen' },
    },
  ],
};

describe('GET /api/patterns', () => {
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
    expect(data.patterns).toEqual([]);
    expect(data.total).toBe(0);
  });

  it('returns formatted patterns with resolved organ system name', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => DRUPAL_RESPONSE,
    });
    const res = await GET(makeReq());
    const data = await res.json();
    expect(data.patterns).toHaveLength(1);
    const pat = data.patterns[0];
    expect(pat.id).toBe('pat-1');
    expect(pat.title).toBe('Spleen Qi Deficiency');
    expect(pat.chineseName).toBe('脾气虚');
    expect(pat.pinyinName).toBe('Pí Qì Xū');
    expect(pat.organSystem).toBe('Spleen');
    expect(pat.category).toBe('deficiency');
    expect(pat.temperature).toBe('neutral');
    expect(pat.popularity).toBe('staple');
    expect(pat.editorsPick).toBe(true);
    // Internal _organSystemId should not leak
    expect((pat as Record<string, unknown>)._organSystemId).toBeUndefined();
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
    expect(data.patterns).toEqual([]);
  });
});
