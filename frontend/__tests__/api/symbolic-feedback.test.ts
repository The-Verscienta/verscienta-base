/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock CSRF validation
jest.mock('@/lib/csrf', () => ({
  validateCsrfToken: jest.fn().mockReturnValue({ valid: true }),
}));

// Mock rate limiting
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

import { POST } from '@/app/api/symbolic-feedback/route';
import { validateCsrfToken } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limit';

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/symbolic-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/symbolic-feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default mock return values
    (validateCsrfToken as jest.Mock).mockReturnValue({ valid: true });
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: true,
      remaining: 10,
      reset: Date.now() + 60000,
    });
  });

  it('returns 403 when CSRF token is invalid', async () => {
    (validateCsrfToken as jest.Mock).mockReturnValue({
      valid: false,
      error: 'CSRF token mismatch',
    });

    const request = createRequest({
      query: { expression: '2+2' },
      result: { simplified: '4' },
      rating: 'up',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toMatch(/invalid request/i);
  });

  it('returns 429 when rate limit is exceeded', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
      retryAfter: 30,
    });

    const request = createRequest({
      query: { expression: '2+2' },
      result: { simplified: '4' },
      rating: 'up',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toMatch(/rate limit/i);
    expect(data.retryAfter).toBe(30);
  });

  it('returns 400 when payload is missing required fields (no query)', async () => {
    const request = createRequest({
      result: { simplified: '4' },
      rating: 'up',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/invalid feedback payload/i);
  });

  it('returns 400 when payload is missing result', async () => {
    const request = createRequest({
      query: { expression: '2+2' },
      rating: 'up',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/invalid feedback payload/i);
  });

  it('returns 400 when rating is not "up" or "down"', async () => {
    const request = createRequest({
      query: { expression: '2+2' },
      result: { simplified: '4' },
      rating: 'neutral',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/invalid feedback payload/i);
  });

  it('returns 400 when rating is missing entirely', async () => {
    const request = createRequest({
      query: { expression: '2+2' },
      result: { simplified: '4' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/invalid feedback payload/i);
  });

  it('returns 200 with {success: true} for valid feedback with rating "up"', async () => {
    const request = createRequest({
      query: { expression: '2+2' },
      result: { simplified: '4' },
      rating: 'up',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 200 with {success: true} for valid feedback with rating "down"', async () => {
    const request = createRequest({
      query: { expression: 'x^2' },
      result: { simplified: 'x**2' },
      rating: 'down',
      comment: 'Formatting is wrong',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 500 when request body is not valid JSON', async () => {
    const request = new NextRequest('http://localhost/api/symbolic-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toMatch(/failed to process/i);
  });
});
