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
    auth: { interval: 60000, maxRequests: 5 },
  },
  createRateLimitHeaders: jest.fn().mockReturnValue({}),
}));

jest.mock('@/lib/auth', () => ({
  authenticateUser: jest.fn(),
}));

const mockCookieSet = jest.fn();
jest.mock('next/headers', () => {
  // Return the already-initialized mockCookieSet via closure over the hoisted variable
  return {
    cookies: jest.fn().mockResolvedValue({
      set: (...args: unknown[]) => mockCookieSet(...args),
    }),
  };
});

import { POST } from '@/app/api/auth/login/route';
import { validateCsrfToken } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limit';
import { authenticateUser } from '@/lib/auth';

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (validateCsrfToken as jest.Mock).mockReturnValue({ valid: true });
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: true,
      remaining: 10,
      reset: Date.now() + 60000,
    });
  });

  it('returns 403 when CSRF token is invalid', async () => {
    (validateCsrfToken as jest.Mock).mockReturnValue({ valid: false });

    const response = await POST(createRequest({ username: 'a', password: 'b' }));
    expect(response.status).toBe(403);
  });

  it('returns 429 when rate limited', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
      retryAfter: 60,
    });

    const response = await POST(createRequest({ username: 'a', password: 'b' }));
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.retryAfter).toBe(60);
  });

  it('returns 400 when validation fails (missing fields)', async () => {
    const response = await POST(createRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/validation failed/i);
  });

  it('returns success and sets cookies on valid login', async () => {
    (authenticateUser as jest.Mock).mockResolvedValue({
      access_token: 'access-123',
      refresh_token: 'refresh-456',
      expires_in: 3600,
    });

    const response = await POST(createRequest({
      username: 'testuser',
      password: 'Password123!',
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // access_token cookie
    expect(mockCookieSet).toHaveBeenCalledWith(
      'access_token',
      'access-123',
      expect.objectContaining({
        httpOnly: true,
        maxAge: 3600,
        path: '/',
      })
    );

    // refresh_token cookie
    expect(mockCookieSet).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-456',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
      })
    );
  });

  it('does not set refresh_token cookie when not provided', async () => {
    (authenticateUser as jest.Mock).mockResolvedValue({
      access_token: 'access-123',
      expires_in: 3600,
    });

    await POST(createRequest({
      username: 'testuser',
      password: 'Password123!',
    }));

    // Should only set access_token
    expect(mockCookieSet).toHaveBeenCalledTimes(1);
    expect(mockCookieSet).toHaveBeenCalledWith(
      'access_token',
      'access-123',
      expect.any(Object)
    );
  });

  it('returns 401 when authentication fails', async () => {
    (authenticateUser as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));
    jest.spyOn(console, 'error').mockImplementation();

    const response = await POST(createRequest({
      username: 'testuser',
      password: 'wrong',
    }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid credentials');
    jest.restoreAllMocks();
  });
});
