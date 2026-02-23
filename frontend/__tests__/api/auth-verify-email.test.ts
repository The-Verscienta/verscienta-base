/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({
    success: true,
    remaining: 10,
    reset: Date.now() + 60000,
  }),
  getClientIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
  RATE_LIMITS: {
    auth: { interval: 60000, maxRequests: 5 },
  },
  createRateLimitHeaders: jest.fn().mockReturnValue({}),
}));

jest.mock('@/lib/verification-token', () => ({
  validateVerificationToken: jest.fn(),
}));

// Mock global fetch for Drupal API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { GET } from '@/app/api/auth/verify-email/route';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateVerificationToken } from '@/lib/verification-token';

function createRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/auth/verify-email');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url.toString(), { method: 'GET' });
}

describe('GET /api/auth/verify-email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: true,
      remaining: 10,
      reset: Date.now() + 60000,
    });
    process.env.NEXT_PUBLIC_DRUPAL_BASE_URL = 'http://drupal.test';
  });

  it('returns 429 when rate limited', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
      retryAfter: 30,
    });

    const response = await GET(createRequest({ token: 'abc', uid: '123' }));
    expect(response.status).toBe(429);
  });

  it('returns 400 when token is missing', async () => {
    const response = await GET(createRequest({ uid: '123' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/missing/i);
  });

  it('returns 400 when uid is missing', async () => {
    const response = await GET(createRequest({ token: 'abc' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/missing/i);
  });

  it('returns 400 when token is invalid', async () => {
    (validateVerificationToken as jest.Mock).mockResolvedValue({
      valid: false,
      error: 'Invalid token',
    });

    const response = await GET(createRequest({ token: 'bad-token', uid: 'user-1' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/invalid verification link/i);
  });

  it('returns 400 with expiry message when token has expired', async () => {
    (validateVerificationToken as jest.Mock).mockResolvedValue({
      valid: false,
      error: 'Token has expired',
    });

    const response = await GET(createRequest({ token: 'expired', uid: 'user-1' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/expired/i);
  });

  it('returns success when token is valid and Drupal activates user', async () => {
    (validateVerificationToken as jest.Mock).mockResolvedValue({ valid: true });
    mockFetch.mockResolvedValue({ ok: true });

    const response = await GET(createRequest({ token: 'valid-token', uid: 'user-uuid' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toMatch(/verified/i);
  });

  it('sends PATCH to Drupal to activate user', async () => {
    (validateVerificationToken as jest.Mock).mockResolvedValue({ valid: true });
    mockFetch.mockResolvedValue({ ok: true });

    await GET(createRequest({ token: 'valid-token', uid: 'user-uuid' }));

    expect(mockFetch).toHaveBeenCalledWith(
      'http://drupal.test/jsonapi/user/user/user-uuid',
      expect.objectContaining({
        method: 'PATCH',
      })
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.data.attributes.status).toBe(true);
  });

  it('returns 400 when Drupal activation fails', async () => {
    (validateVerificationToken as jest.Mock).mockResolvedValue({ valid: true });
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const response = await GET(createRequest({ token: 'valid-token', uid: 'user-uuid' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/failed|expired/i);
  });

  it('returns 500 when an unexpected error occurs', async () => {
    (validateVerificationToken as jest.Mock).mockRejectedValue(new Error('crypto error'));
    jest.spyOn(console, 'error').mockImplementation();

    const response = await GET(createRequest({ token: 'x', uid: 'y' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toMatch(/failed|try again/i);
    jest.restoreAllMocks();
  });
});
