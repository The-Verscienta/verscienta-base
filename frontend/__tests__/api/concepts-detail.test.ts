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

import { GET } from '@/app/api/concepts/[id]/route';
import { checkRateLimit } from '@/lib/rate-limit';

const CONCEPT_UUID = 'b2c3d4e5-f6a7-8901-bcde-f23456789012';

function makeReq() {
  return new NextRequest(`http://localhost/api/concepts/${CONCEPT_UUID}`, { method: 'GET' });
}
function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const FULL_CONCEPT_RESPONSE = {
  data: {
    id: CONCEPT_UUID,
    type: 'node--tcm_concept',
    attributes: {
      title: 'Qi',
      field_concept_chinese_name: '气',
      field_concept_pinyin_name: 'Qì',
      field_popularity: 'staple',
      field_editors_pick: true,
      field_clinical_relevance: {
        value: 'Qi is the fundamental vital energy',
        format: 'basic_html',
        processed: '<p>Qi is the fundamental vital energy</p>',
      },
    },
    relationships: {
      field_concept_category: { data: { id: 'cat-1', type: 'taxonomy_term--concept_category' } },
      field_related_patterns: { data: [{ id: 'pat-1', type: 'node--tcm_pattern' }] },
      field_related_herbs: { data: [] },
      field_related_formulas: { data: [{ id: 'form-1', type: 'node--formula' }] },
    },
  },
  included: [
    {
      id: 'cat-1',
      type: 'taxonomy_term--concept_category',
      attributes: { name: 'Fundamental Substances' },
    },
    {
      id: 'pat-1',
      type: 'node--tcm_pattern',
      attributes: { title: 'Spleen Qi Deficiency' },
    },
    {
      id: 'form-1',
      type: 'node--formula',
      attributes: { title: 'Si Jun Zi Tang' },
    },
  ],
};

describe('GET /api/concepts/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: true, remaining: 10, reset: Date.now() + 60000, retryAfter: 0,
    });
  });

  it('returns 404 when Drupal returns 404', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });
    const res = await GET(makeReq(), makeParams(CONCEPT_UUID));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.concept).toBeNull();
  });

  it('returns 502 on Drupal non-404 error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    const res = await GET(makeReq(), makeParams(CONCEPT_UUID));
    expect(res.status).toBe(502);
  });

  it('returns full concept with resolved relationships', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => FULL_CONCEPT_RESPONSE,
    });
    const res = await GET(makeReq(), makeParams(CONCEPT_UUID));
    const data = await res.json();
    expect(res.status).toBe(200);
    const con = data.concept;
    expect(con.id).toBe(CONCEPT_UUID);
    expect(con.title).toBe('Qi');
    expect(con.field_concept_chinese_name).toBe('气');
    expect(con.field_concept_pinyin_name).toBe('Qì');
    expect(con.field_concept_category?.name).toBe('Fundamental Substances');
    expect(con.field_related_patterns).toHaveLength(1);
    expect(con.field_related_patterns[0].title).toBe('Spleen Qi Deficiency');
    expect(con.field_related_herbs).toEqual([]);
    expect(con.field_related_formulas).toHaveLength(1);
    expect(con.field_related_formulas[0].title).toBe('Si Jun Zi Tang');
  });

  it('handles missing optional fields gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: CONCEPT_UUID,
          type: 'node--tcm_concept',
          attributes: { title: 'Minimal Concept' },
          relationships: {},
        },
        included: [],
      }),
    });
    const res = await GET(makeReq(), makeParams(CONCEPT_UUID));
    const data = await res.json();
    expect(res.status).toBe(200);
    const con = data.concept;
    expect(con.title).toBe('Minimal Concept');
    expect(con.field_concept_category).toBeNull();
    expect(con.field_related_patterns).toEqual([]);
    expect(con.field_related_herbs).toEqual([]);
    expect(con.field_related_formulas).toEqual([]);
  });

  it('returns 429 when rate limited', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false, remaining: 0, reset: Date.now() + 60000, retryAfter: 30,
    });
    const res = await GET(makeReq(), makeParams(CONCEPT_UUID));
    expect(res.status).toBe(429);
  });

  it('returns 500 on fetch error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));
    const res = await GET(makeReq(), makeParams(CONCEPT_UUID));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.concept).toBeNull();
  });
});
