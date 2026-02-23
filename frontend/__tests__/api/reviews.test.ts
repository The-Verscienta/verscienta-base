/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

jest.mock('@/lib/csrf', () => ({
  validateCsrfToken: jest.fn().mockReturnValue({ valid: true }),
}));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({
    success: true,
    remaining: 10,
    reset: Date.now() + 60000,
  }),
  getClientIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
  RATE_LIMITS: {
    api: { interval: 60000, maxRequests: 60 },
  },
  createRateLimitHeaders: jest.fn().mockReturnValue({}),
}));

const mockCookieGet = jest.fn();
jest.mock('next/headers', () => {
  return {
    cookies: jest.fn().mockResolvedValue({
      get: (...args: unknown[]) => mockCookieGet(...args),
    }),
  };
});

// Mock global fetch for Drupal API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { POST } from '@/app/api/reviews/route';
import { validateCsrfToken } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limit';

const validReview = {
  rating: 4,
  comment: 'Very helpful herb for sleep.',
  reviewedEntityType: 'herb',
  reviewedEntityId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
};

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (validateCsrfToken as jest.Mock).mockReturnValue({ valid: true });
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: true,
      remaining: 10,
      reset: Date.now() + 60000,
    });
    mockCookieGet.mockReturnValue({ value: 'mock-access-token' });
    process.env.NEXT_PUBLIC_DRUPAL_BASE_URL = 'http://drupal.test';
  });

  it('returns 403 when CSRF token is invalid', async () => {
    (validateCsrfToken as jest.Mock).mockReturnValue({ valid: false });

    const response = await POST(createRequest(validReview));
    expect(response.status).toBe(403);
  });

  it('returns 429 when rate limited', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
      retryAfter: 30,
    });

    const response = await POST(createRequest(validReview));
    expect(response.status).toBe(429);
  });

  it('returns 401 when not authenticated', async () => {
    mockCookieGet.mockReturnValue(undefined);

    const response = await POST(createRequest(validReview));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toMatch(/logged in/i);
  });

  it('returns 400 when validation fails', async () => {
    const response = await POST(createRequest({ rating: 'high' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/validation failed/i);
  });

  it('returns 400 for invalid entity type', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'review-1' } }),
    });

    const response = await POST(createRequest({
      ...validReview,
      reviewedEntityType: 'widget',
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
  });

  it('returns 201 when review is created successfully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'review-uuid-123' } }),
    });

    const response = await POST(createRequest(validReview));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.review.id).toBe('review-uuid-123');
  });

  it('sends correct payload to Drupal JSON:API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'review-1' } }),
    });

    await POST(createRequest(validReview));

    expect(mockFetch).toHaveBeenCalledWith(
      'http://drupal.test/jsonapi/node/review',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-access-token',
        }),
      })
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.data.attributes.field_rating).toBe(4);
    expect(body.data.attributes.status).toBe(false); // pending moderation
  });

  it('returns 403 when Drupal denies permission', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ errors: [{ detail: 'Access denied' }] }),
    });

    const response = await POST(createRequest(validReview));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toMatch(/permission/i);
  });

  it('returns 500 when request body is invalid JSON', async () => {
    jest.spyOn(console, 'error').mockImplementation();

    const request = new NextRequest('http://localhost/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    jest.restoreAllMocks();
  });
});
