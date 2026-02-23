/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Store original fetch before mocking
const originalFetch = global.fetch;

// Mock global fetch for Drupal JSON:API calls
beforeAll(() => {
  global.fetch = jest.fn();
});

afterAll(() => {
  global.fetch = originalFetch;
});

import { GET } from '@/app/api/knowledge-graph/route';

const HERB_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function createRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/knowledge-graph');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url.toString(), { method: 'GET' });
}

/**
 * Helper to set up global.fetch mock responses.
 * Accepts a map of URL substring patterns to response data.
 */
function mockFetchResponses(responses: Record<string, { ok: boolean; data: unknown }>) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    for (const [pattern, response] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return Promise.resolve({
          ok: response.ok,
          json: () => Promise.resolve(response.data),
        });
      }
    }
    // Default: return empty data for unmatched URLs
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });
  });
}

describe('GET /api/knowledge-graph', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when herb param is missing', async () => {
    const request = createRequest({});

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/missing.*herb/i);
  });

  it('returns 404 when herb is not found', async () => {
    mockFetchResponses({
      [`node/herb/${HERB_UUID}`]: {
        ok: true,
        data: { data: null },
      },
    });

    const request = createRequest({ herb: HERB_UUID });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toMatch(/not found/i);
  });

  it('returns graph data with herb node for a valid herb', async () => {
    mockFetchResponses({
      [`node/herb/${HERB_UUID}?include`]: {
        ok: true,
        data: {
          data: {
            id: HERB_UUID,
            attributes: { title: 'Ginseng' },
          },
          included: [],
        },
      },
      [`node/herb/${HERB_UUID}`]: {
        ok: true,
        data: {
          data: {
            id: HERB_UUID,
            attributes: { title: 'Ginseng' },
          },
        },
      },
      ['node/tcm_ingredient']: {
        ok: true,
        data: { data: [] },
      },
      ['node/tcm_target_interaction']: {
        ok: true,
        data: { data: [] },
      },
    });

    const request = createRequest({ herb: HERB_UUID });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.nodes).toBeDefined();
    expect(data.links).toBeDefined();
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(Array.isArray(data.links)).toBe(true);

    // Should contain at least the herb node
    const herbNode = data.nodes.find((n: { id: string }) => n.id === HERB_UUID);
    expect(herbNode).toBeDefined();
    expect(herbNode.label).toBe('Ginseng');
    expect(herbNode.type).toBe('herb');
    expect(herbNode.color).toBe('#4ade80');
  });

  it('returns graph data with ingredient and condition nodes', async () => {
    const ingredientId = 'ing-1111-2222-3333-444444444444';
    const conditionId = 'cond-5555-6666-7777-888888888888';

    mockFetchResponses({
      [`node/herb/${HERB_UUID}?include`]: {
        ok: true,
        data: {
          data: {
            id: HERB_UUID,
            attributes: { title: 'Astragalus' },
          },
          included: [
            {
              id: conditionId,
              type: 'node--condition',
              attributes: { title: 'Fatigue' },
            },
          ],
        },
      },
      [`node/herb/${HERB_UUID}`]: {
        ok: true,
        data: {
          data: {
            id: HERB_UUID,
            attributes: { title: 'Astragalus' },
          },
        },
      },
      ['node/tcm_ingredient']: {
        ok: true,
        data: {
          data: [
            {
              id: ingredientId,
              attributes: { title: 'Astragaloside IV' },
            },
          ],
        },
      },
      ['node/tcm_target_interaction']: {
        ok: true,
        data: { data: [] },
      },
    });

    const request = createRequest({ herb: HERB_UUID });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Herb node
    const herbNode = data.nodes.find((n: { type: string }) => n.type === 'herb');
    expect(herbNode).toBeDefined();
    expect(herbNode.label).toBe('Astragalus');

    // Ingredient node
    const ingredientNode = data.nodes.find((n: { type: string }) => n.type === 'ingredient');
    expect(ingredientNode).toBeDefined();
    expect(ingredientNode.id).toBe(ingredientId);
    expect(ingredientNode.label).toBe('Astragaloside IV');
    expect(ingredientNode.color).toBe('#60a5fa');

    // Condition node
    const conditionNode = data.nodes.find((n: { type: string }) => n.type === 'condition');
    expect(conditionNode).toBeDefined();
    expect(conditionNode.id).toBe(conditionId);
    expect(conditionNode.label).toBe('Fatigue');
    expect(conditionNode.color).toBe('#f87171');

    // Links: herb -> ingredient ("contains"), herb -> condition ("treats")
    const containsLink = data.links.find((l: { label: string }) => l.label === 'contains');
    expect(containsLink).toBeDefined();
    expect(containsLink.source).toBe(HERB_UUID);
    expect(containsLink.target).toBe(ingredientId);

    const treatsLink = data.links.find((l: { label: string }) => l.label === 'treats');
    expect(treatsLink).toBeDefined();
    expect(treatsLink.source).toBe(HERB_UUID);
    expect(treatsLink.target).toBe(conditionId);
  });

  it('returns target nodes at depth >= 2', async () => {
    const targetId = 'target-aaaa-bbbb-cccc-dddddddddddd';

    mockFetchResponses({
      [`node/herb/${HERB_UUID}?include`]: {
        ok: true,
        data: {
          data: {
            id: HERB_UUID,
            attributes: { title: 'Turmeric' },
          },
          included: [],
        },
      },
      [`node/herb/${HERB_UUID}`]: {
        ok: true,
        data: {
          data: {
            id: HERB_UUID,
            attributes: { title: 'Turmeric' },
          },
        },
      },
      ['node/tcm_ingredient']: {
        ok: true,
        data: { data: [] },
      },
      ['node/tcm_target_interaction']: {
        ok: true,
        data: {
          data: [
            {
              id: targetId,
              attributes: {
                title: 'NF-kB',
                field_target_name: 'NF-kB Pathway',
              },
              relationships: {},
            },
          ],
        },
      },
    });

    // Default depth is 2, which includes target interactions
    const request = createRequest({ herb: HERB_UUID });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    const targetNode = data.nodes.find((n: { type: string }) => n.type === 'target');
    expect(targetNode).toBeDefined();
    expect(targetNode.id).toBe(targetId);
    expect(targetNode.label).toBe('NF-kB Pathway');
    expect(targetNode.color).toBe('#fb923c');

    const targetsLink = data.links.find((l: { label: string }) => l.label === 'targets');
    expect(targetsLink).toBeDefined();
    expect(targetsLink.source).toBe(HERB_UUID);
    expect(targetsLink.target).toBe(targetId);
  });

  it('returns 500 when fetch throws an error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const request = createRequest({ herb: HERB_UUID });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toMatch(/failed to build/i);
  });
});
