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
  registerUser: jest.fn(),
}));

jest.mock('@/lib/turnstile', () => ({
  requireTurnstileVerification: jest.fn().mockResolvedValue({ verified: true }),
}));

import { POST } from '@/app/api/auth/register/route';
import { validateCsrfToken } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limit';
import { registerUser } from '@/lib/auth';
import { requireTurnstileVerification } from '@/lib/turnstile';

const validRegistration = {
  username: 'newuser',
  email: 'new@example.com',
  password: 'StrongPass123!',
  confirmPassword: 'StrongPass123!',
  firstName: 'Jane',
  lastName: 'Doe',
  turnstileToken: 'valid-token',
};

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '1.2.3.4',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (validateCsrfToken as jest.Mock).mockReturnValue({ valid: true });
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: true,
      remaining: 10,
      reset: Date.now() + 60000,
    });
    (requireTurnstileVerification as jest.Mock).mockResolvedValue({ verified: true });
  });

  it('returns 403 when CSRF token is invalid', async () => {
    (validateCsrfToken as jest.Mock).mockReturnValue({ valid: false });

    const response = await POST(createRequest(validRegistration));
    expect(response.status).toBe(403);
  });

  it('returns 429 when rate limited', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
      retryAfter: 60,
    });

    const response = await POST(createRequest(validRegistration));
    expect(response.status).toBe(429);
  });

  it('returns 400 when Turnstile verification fails', async () => {
    (requireTurnstileVerification as jest.Mock).mockResolvedValue({
      verified: false,
      error: 'CAPTCHA verification failed',
    });

    const response = await POST(createRequest(validRegistration));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('CAPTCHA verification failed');
  });

  it('returns 400 when validation fails', async () => {
    const response = await POST(createRequest({
      ...validRegistration,
      email: 'not-an-email',
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/validation failed/i);
  });

  it('returns success on valid registration', async () => {
    (registerUser as jest.Mock).mockResolvedValue({
      id: 'user-uuid-1',
      name: 'newuser',
      mail: 'new@example.com',
    });

    const response = await POST(createRequest(validRegistration));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.id).toBe('user-uuid-1');
    expect(data.user.name).toBe('newuser');
  });

  it('passes correct fields to registerUser', async () => {
    (registerUser as jest.Mock).mockResolvedValue({
      id: 'user-1',
      name: 'newuser',
      mail: 'new@example.com',
    });

    await POST(createRequest(validRegistration));

    expect(registerUser).toHaveBeenCalledWith({
      name: 'newuser',
      mail: 'new@example.com',
      pass: 'StrongPass123!',
      field_first_name: 'Jane',
      field_last_name: 'Doe',
    });
  });

  it('returns 400 when registerUser throws', async () => {
    (registerUser as jest.Mock).mockRejectedValue(new Error('Username already taken'));
    jest.spyOn(console, 'error').mockImplementation();

    const response = await POST(createRequest(validRegistration));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Username already taken');
    jest.restoreAllMocks();
  });

  it('passes client IP to Turnstile verification', async () => {
    (registerUser as jest.Mock).mockResolvedValue({
      id: 'user-1',
      name: 'newuser',
      mail: 'new@example.com',
    });

    await POST(createRequest(validRegistration));

    expect(requireTurnstileVerification).toHaveBeenCalledWith('valid-token', '1.2.3.4');
  });
});
