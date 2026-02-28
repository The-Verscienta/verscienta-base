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

import { GET } from '@/app/api/herbs/[id]/targets/route';
import { checkRateLimit } from '@/lib/rate-limit';

const HERB_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function makeReq() {
  return new NextRequest(`http://localhost/api/herbs/${HERB_UUID}/targets`, { method: 'GET' });
}
function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/herbs/[id]/targets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: true, remaining: 10, reset: Date.now() + 60000, retryAfter: 0,
    });
  });

  it('returns empty targets when Drupal returns non-ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
    const res = await GET(makeReq(), makeParams(HERB_UUID));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.targets).toEqual([]);
    expect(data.count).toBe(0);
  });

  it('returns formatted targets from Drupal response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 'target-1',
            attributes: {
              field_target_name: 'Tumor Necrosis Factor Alpha',
              field_gene_name: 'TNF',
              field_uniprot_id: 'P01375',
              field_score: '0.85',
              field_evidence_type: ['predicted', 'experimental'],
              field_source_db: 'BATMAN-TCM',
            },
          },
          {
            id: 'target-2',
            attributes: {
              field_target_name: 'Cyclooxygenase-2',
              field_gene_name: 'PTGS2',
              field_score: '0.72',
              // single string evidence_type should wrap to array
              field_evidence_type: 'predicted',
            },
          },
        ],
      }),
    });

    const res = await GET(makeReq(), makeParams(HERB_UUID));
    const data = await res.json();

    expect(data.count).toBe(2);
    expect(data.targets[0]).toMatchObject({
      id: 'target-1',
      target_name: 'Tumor Necrosis Factor Alpha',
      gene_name: 'TNF',
      uniprot_id: 'P01375',
      score: 0.85,
      source_db: 'BATMAN-TCM',
    });
    expect(data.targets[0].evidence_type).toEqual(['predicted', 'experimental']);
    expect(data.targets[1].evidence_type).toEqual(['predicted']);
  });

  it('returns 500 on fetch error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));
    const res = await GET(makeReq(), makeParams(HERB_UUID));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.targets).toEqual([]);
  });

  it('returns 429 when rate limited', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false, remaining: 0, reset: Date.now() + 60000, retryAfter: 30,
    });
    const res = await GET(makeReq(), makeParams(HERB_UUID));
    expect(res.status).toBe(429);
  });
});
