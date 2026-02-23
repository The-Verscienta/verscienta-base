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

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue(undefined),
  }),
}));

import { POST } from '@/app/api/bookings/route';
import { validateCsrfToken } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limit';

const validBooking = {
  practitionerId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '555-0100',
  preferredDate: '2026-03-15',
  preferredTime: 'morning',
  visitType: 'initial_consultation',
  message: 'First visit',
};

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/bookings', () => {
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

    const response = await POST(createRequest(validBooking));
    expect(response.status).toBe(403);
  });

  it('returns 429 when rate limited', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
      retryAfter: 45,
    });

    const response = await POST(createRequest(validBooking));
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.retryAfter).toBe(45);
  });

  it('returns 400 when validation fails', async () => {
    const response = await POST(createRequest({ name: 'Jane' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/validation failed/i);
    expect(data.errors).toBeDefined();
  });

  it('returns 400 for invalid email', async () => {
    const response = await POST(createRequest({ ...validBooking, email: 'not-an-email' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBeDefined();
  });

  it('returns 400 for invalid visitType', async () => {
    const response = await POST(createRequest({ ...validBooking, visitType: 'house_call' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBeDefined();
  });

  it('returns 201 with success for valid booking', async () => {
    jest.spyOn(console, 'log').mockImplementation();

    const response = await POST(createRequest(validBooking));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.message).toMatch(/submitted/i);
    jest.restoreAllMocks();
  });

  it('accepts booking without optional phone and message', async () => {
    jest.spyOn(console, 'log').mockImplementation();
    const { phone, message, ...minimal } = validBooking;

    const response = await POST(createRequest(minimal));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    jest.restoreAllMocks();
  });

  it('returns 500 when request body is invalid JSON', async () => {
    jest.spyOn(console, 'error').mockImplementation();

    const request = new NextRequest('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    jest.restoreAllMocks();
  });
});
