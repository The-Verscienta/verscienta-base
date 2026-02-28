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

import { GET } from '@/app/api/patterns/[id]/route';
import { checkRateLimit } from '@/lib/rate-limit';

const PATTERN_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function makeReq() {
  return new NextRequest(`http://localhost/api/patterns/${PATTERN_UUID}`, { method: 'GET' });
}
function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const FULL_PATTERN_RESPONSE = {
  data: {
    id: PATTERN_UUID,
    type: 'node--tcm_pattern',
    attributes: {
      title: 'Spleen Qi Deficiency',
      field_pattern_name_chinese: '脾气虚',
      field_pattern_name_pinyin: 'Pí Qì Xū',
      field_pattern_category: 'deficiency',
      field_temperature: 'neutral',
      field_popularity: 'staple',
      field_editors_pick: true,
      field_etiology: { value: 'Poor diet and overwork', format: 'basic_html', processed: '<p>Poor diet and overwork</p>' },
      field_signs_symptoms: { value: 'Fatigue, bloating', format: 'basic_html', processed: '<p>Fatigue, bloating</p>' },
      field_tongue_criteria: { value: 'Pale, teeth marks', format: 'basic_html', processed: '<p>Pale, teeth marks</p>' },
      field_pulse_criteria: { value: 'Soft, weak', format: 'basic_html', processed: '<p>Soft, weak</p>' },
    },
    relationships: {
      field_organ_system: { data: { id: 'org-spleen', type: 'taxonomy_term--organ_system' } },
      field_related_conditions: { data: [{ id: 'cond-1', type: 'node--condition' }] },
      field_related_herbs: { data: [] },
      field_related_formulas: { data: [{ id: 'form-1', type: 'node--formula' }] },
      field_related_points: { data: [] },
    },
  },
  included: [
    {
      id: 'org-spleen',
      type: 'taxonomy_term--organ_system',
      attributes: { name: 'Spleen' },
    },
    {
      id: 'cond-1',
      type: 'node--condition',
      attributes: { title: 'Chronic Fatigue' },
    },
    {
      id: 'form-1',
      type: 'node--formula',
      attributes: { title: 'Si Jun Zi Tang' },
    },
  ],
};

describe('GET /api/patterns/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: true, remaining: 10, reset: Date.now() + 60000, retryAfter: 0,
    });
  });

  it('returns 404 when Drupal returns 404', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });
    const res = await GET(makeReq(), makeParams(PATTERN_UUID));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.pattern).toBeNull();
  });

  it('returns 502 on Drupal non-404 error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    const res = await GET(makeReq(), makeParams(PATTERN_UUID));
    expect(res.status).toBe(502);
  });

  it('returns full pattern with resolved relationships', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => FULL_PATTERN_RESPONSE,
    });
    const res = await GET(makeReq(), makeParams(PATTERN_UUID));
    const data = await res.json();
    expect(res.status).toBe(200);
    const pat = data.pattern;
    expect(pat.id).toBe(PATTERN_UUID);
    expect(pat.title).toBe('Spleen Qi Deficiency');
    expect(pat.field_pattern_name_chinese).toBe('脾气虚');
    expect(pat.field_pattern_name_pinyin).toBe('Pí Qì Xū');
    expect(pat.field_organ_system?.name).toBe('Spleen');
    expect(pat.field_related_conditions).toHaveLength(1);
    expect(pat.field_related_conditions[0].title).toBe('Chronic Fatigue');
    expect(pat.field_related_herbs).toEqual([]);
    expect(pat.field_related_formulas).toHaveLength(1);
    expect(pat.field_related_formulas[0].title).toBe('Si Jun Zi Tang');
    expect(pat.field_related_points).toEqual([]);
  });

  it('handles missing optional fields gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: PATTERN_UUID,
          type: 'node--tcm_pattern',
          attributes: { title: 'Minimal Pattern' },
          relationships: {},
        },
        included: [],
      }),
    });
    const res = await GET(makeReq(), makeParams(PATTERN_UUID));
    const data = await res.json();
    expect(res.status).toBe(200);
    const pat = data.pattern;
    expect(pat.title).toBe('Minimal Pattern');
    expect(pat.field_organ_system).toBeNull();
    expect(pat.field_related_conditions).toEqual([]);
    expect(pat.field_related_herbs).toEqual([]);
    expect(pat.field_related_formulas).toEqual([]);
    expect(pat.field_related_points).toEqual([]);
  });

  it('returns 429 when rate limited', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false, remaining: 0, reset: Date.now() + 60000, retryAfter: 30,
    });
    const res = await GET(makeReq(), makeParams(PATTERN_UUID));
    expect(res.status).toBe(429);
  });

  it('returns 500 on fetch error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));
    const res = await GET(makeReq(), makeParams(PATTERN_UUID));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.pattern).toBeNull();
  });
});
