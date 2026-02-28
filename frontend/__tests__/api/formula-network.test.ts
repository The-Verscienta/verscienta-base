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

import { GET } from '@/app/api/formulas/[id]/network/route';
import { checkRateLimit } from '@/lib/rate-limit';

const FORMULA_UUID = 'f1f1f1f1-e5f6-7890-abcd-ef1234567890';
const HERB_UUID = 'h1h1h1h1-e5f6-7890-abcd-ef1234567890';
const REL_FORMULA_UUID = 'f2f2f2f2-e5f6-7890-abcd-ef1234567890';

function makeReq() {
  return new NextRequest(`http://localhost/api/formulas/${FORMULA_UUID}/network`, { method: 'GET' });
}
function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/formulas/[id]/network', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: true, remaining: 10, reset: Date.now() + 60000, retryAfter: 0,
    });
  });

  it('returns empty when formula fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
    const res = await GET(makeReq(), makeParams(FORMULA_UUID));
    const data = await res.json();
    expect(data.nodes).toEqual([]);
    expect(data.links).toEqual([]);
  });

  it('returns empty when no herb ingredients found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: FORMULA_UUID,
          attributes: { title: 'Test Formula' },
          relationships: { field_herb_ingredients: { data: [] } },
        },
        included: [],
      }),
    });

    const res = await GET(makeReq(), makeParams(FORMULA_UUID));
    const data = await res.json();
    expect(data.nodes).toEqual([]);
    expect(data.links).toEqual([]);
  });

  it('returns empty when fewer than 2 related formulas found', async () => {
    // Formula with one herb
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: FORMULA_UUID,
            attributes: { title: 'Test Formula' },
            relationships: {
              field_herb_ingredients: { data: [{ id: 'para-1', type: 'paragraph--herb_ingredient' }] },
            },
          },
          included: [
            {
              id: 'para-1',
              type: 'paragraph--herb_ingredient',
              relationships: { field_herb_reference: { data: { id: HERB_UUID } } },
            },
            {
              id: HERB_UUID,
              type: 'node--herb',
              attributes: { title: 'Ginger' },
            },
          ],
        }),
      })
      // Related formulas fetch: returns only 1 other formula (< 2, so returns empty)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: REL_FORMULA_UUID, attributes: { title: 'Other Formula' } }],
        }),
      });

    const res = await GET(makeReq(), makeParams(FORMULA_UUID));
    const data = await res.json();
    // Only 1 related formula → returns empty
    expect(data.nodes).toEqual([]);
    expect(data.links).toEqual([]);
  });

  it('returns nodes and links when formulas share herbs', async () => {
    const REL2 = 'f3f3f3f3-e5f6-7890-abcd-ef1234567890';
    // Formula with one herb
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: FORMULA_UUID,
            attributes: { title: 'Base Formula' },
            relationships: {
              field_herb_ingredients: { data: [{ id: 'para-1', type: 'paragraph--herb_ingredient' }] },
            },
          },
          included: [
            {
              id: 'para-1',
              type: 'paragraph--herb_ingredient',
              relationships: { field_herb_reference: { data: { id: HERB_UUID } } },
            },
            { id: HERB_UUID, type: 'node--herb', attributes: { title: 'Astragalus' } },
          ],
        }),
      })
      // Two related formulas for that herb
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: REL_FORMULA_UUID, attributes: { title: 'Formula B' } },
            { id: REL2, attributes: { title: 'Formula C' } },
          ],
        }),
      });

    const res = await GET(makeReq(), makeParams(FORMULA_UUID));
    const data = await res.json();

    expect(data.nodes.length).toBeGreaterThanOrEqual(3); // current + 2 related
    expect(data.nodes.find((n: any) => n.type === 'current')).toBeTruthy();
    expect(data.nodes.find((n: any) => n.id === REL_FORMULA_UUID)).toBeTruthy();
    expect(data.links.length).toBeGreaterThanOrEqual(2);
  });

  it('returns 429 when rate limited', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false, remaining: 0, reset: Date.now() + 60000, retryAfter: 30,
    });
    const res = await GET(makeReq(), makeParams(FORMULA_UUID));
    expect(res.status).toBe(429);
  });
});
