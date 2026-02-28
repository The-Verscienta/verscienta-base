/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

jest.mock('@/lib/csrf', () => ({
  validateCsrfToken: jest.fn().mockReturnValue({ valid: true }),
}));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({
    success: true, remaining: 10, reset: Date.now() + 60000, retryAfter: 0,
  }),
  getClientIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
  RATE_LIMITS: { ai: { interval: 60000, maxRequests: 10 } },
  createRateLimitHeaders: jest.fn().mockReturnValue({}),
}));

jest.mock('@/lib/grok', () => ({
  explainFormula: jest.fn(),
}));

import { POST } from '@/app/api/grok/explain-formula/route';
import { validateCsrfToken } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limit';
import { explainFormula } from '@/lib/grok';

const VALID_BODY = {
  formulaName: 'Si Jun Zi Tang',
  ingredients: ['Ren Shen', 'Bai Zhu', 'Fu Ling', 'Gan Cao'],
  actions: 'Tonifies Qi',
  indications: 'Qi deficiency with fatigue',
};

function makeReq(body: unknown = VALID_BODY) {
  return new NextRequest('http://localhost/api/grok/explain-formula', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/grok/explain-formula', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (validateCsrfToken as jest.Mock).mockReturnValue({ valid: true });
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: true, remaining: 10, reset: Date.now() + 60000, retryAfter: 0,
    });
    process.env.XAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.XAI_API_KEY;
  });

  it('returns 403 when CSRF is invalid', async () => {
    (validateCsrfToken as jest.Mock).mockReturnValue({ valid: false, error: 'mismatch' });
    const res = await POST(makeReq());
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toMatch(/invalid request/i);
  });

  it('returns 429 when rate limited', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false, remaining: 0, reset: Date.now() + 60000, retryAfter: 30,
    });
    const res = await POST(makeReq());
    expect(res.status).toBe(429);
  });

  it('returns 400 on invalid body', async () => {
    const res = await POST(makeReq({ formulaName: '', ingredients: 'not-array' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/validation/i);
  });

  it('returns 503 when XAI_API_KEY is missing', async () => {
    delete process.env.XAI_API_KEY;
    const res = await POST(makeReq());
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.isConfigError).toBe(true);
  });

  it('returns explanation on success', async () => {
    (explainFormula as jest.Mock).mockResolvedValueOnce(
      'This formula gently supports your energy. It contains four herbs that work together...'
    );
    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.explanation).toContain('formula');
  });

  it('returns 503 when explainFormula throws xAI API error', async () => {
    (explainFormula as jest.Mock).mockRejectedValueOnce(new Error('xAI API error: rate limit'));
    const res = await POST(makeReq());
    expect(res.status).toBe(503);
  });

  it('returns 500 when explainFormula throws generic error', async () => {
    (explainFormula as jest.Mock).mockRejectedValueOnce(new Error('unexpected failure'));
    const res = await POST(makeReq());
    expect(res.status).toBe(500);
  });
});
