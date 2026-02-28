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

import { GET } from '@/app/api/points/[id]/route';
import { checkRateLimit } from '@/lib/rate-limit';

const POINT_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function makeReq() {
  return new NextRequest(`http://localhost/api/points/${POINT_UUID}`, { method: 'GET' });
}
function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const FULL_POINT_RESPONSE = {
  data: {
    id: POINT_UUID,
    type: 'node--acupuncture_point',
    attributes: {
      title: 'Leg Three Miles',
      field_point_code: 'ST-36',
      field_point_pinyin_name: 'Zu San Li',
      field_point_chinese_name: '足三里',
      field_location_description: '3 cun below ST-35, one finger width lateral to the anterior crest of the tibia',
      field_location_anatomical: 'Tibialis anterior muscle',
      field_needling_depth: '0.5–1.5 cun',
      field_needling_angle: 'perpendicular',
      field_needling_method: 'Tonification or even technique',
      field_moxa_suitable: true,
      field_moxa_cones: 7,
      field_press_needle_suitable: false,
      field_actions: { value: 'Tonifies Qi and Blood', format: 'basic_html', processed: '<p>Tonifies Qi and Blood</p>' },
      field_indications: { value: 'Digestive disorders', format: 'basic_html', processed: '<p>Digestive disorders</p>' },
      field_special_properties: ['command_point', 'five_element_earth'],
      field_popularity: 'staple',
      field_editors_pick: true,
      field_beginner_friendly: true,
      field_meridian_number: 36,
    },
    relationships: {
      field_meridian: { data: { id: 'mer-stomach', type: 'taxonomy_term--meridian' } },
      field_related_conditions: { data: [{ id: 'cond-1', type: 'node--condition' }] },
      field_related_herbs: { data: [] },
      field_related_formulas: { data: [] },
    },
  },
  included: [
    {
      id: 'mer-stomach',
      type: 'taxonomy_term--meridian',
      attributes: { name: 'Stomach' },
    },
    {
      id: 'cond-1',
      type: 'node--condition',
      attributes: { title: 'Digestive Disorders' },
    },
  ],
};

describe('GET /api/points/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: true, remaining: 10, reset: Date.now() + 60000, retryAfter: 0,
    });
  });

  it('returns 404 when Drupal returns 404', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });
    const res = await GET(makeReq(), makeParams(POINT_UUID));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.point).toBeNull();
  });

  it('returns 502 on Drupal non-404 error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    const res = await GET(makeReq(), makeParams(POINT_UUID));
    expect(res.status).toBe(502);
  });

  it('returns full point with resolved relationships', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => FULL_POINT_RESPONSE,
    });
    const res = await GET(makeReq(), makeParams(POINT_UUID));
    const data = await res.json();
    expect(res.status).toBe(200);
    const pt = data.point;
    expect(pt.id).toBe(POINT_UUID);
    expect(pt.field_point_code).toBe('ST-36');
    expect(pt.field_point_pinyin_name).toBe('Zu San Li');
    expect(pt.field_meridian?.name).toBe('Stomach');
    expect(pt.field_related_conditions).toHaveLength(1);
    expect(pt.field_related_conditions[0].title).toBe('Digestive Disorders');
    expect(pt.field_related_herbs).toEqual([]);
    expect(pt.field_moxa_suitable).toBe(true);
    expect(pt.field_moxa_cones).toBe(7);
    expect(pt.field_special_properties).toContain('command_point');
  });

  it('handles missing optional fields gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: POINT_UUID,
          type: 'node--acupuncture_point',
          attributes: { title: 'Minimal Point', field_point_code: 'LU-1' },
          relationships: {},
        },
        included: [],
      }),
    });
    const res = await GET(makeReq(), makeParams(POINT_UUID));
    const data = await res.json();
    expect(res.status).toBe(200);
    const pt = data.point;
    expect(pt.title).toBe('Minimal Point');
    expect(pt.field_meridian).toBeNull();
    expect(pt.field_related_conditions).toEqual([]);
    expect(pt.field_related_herbs).toEqual([]);
    expect(pt.field_related_formulas).toEqual([]);
  });

  it('returns 429 when rate limited', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false, remaining: 0, reset: Date.now() + 60000, retryAfter: 30,
    });
    const res = await GET(makeReq(), makeParams(POINT_UUID));
    expect(res.status).toBe(429);
  });

  it('returns 500 on fetch error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));
    const res = await GET(makeReq(), makeParams(POINT_UUID));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.point).toBeNull();
  });
});
