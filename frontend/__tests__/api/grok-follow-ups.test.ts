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
    ai: { interval: 60000, maxRequests: 10 },
  },
  createRateLimitHeaders: jest.fn().mockReturnValue({}),
}));

jest.mock('@/lib/grok', () => ({
  generateFollowUpQuestions: jest.fn(),
}));

import { POST } from '@/app/api/grok/follow-ups/route';
import { validateCsrfToken } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateFollowUpQuestions } from '@/lib/grok';

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/grok/follow-ups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/grok/follow-ups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (validateCsrfToken as jest.Mock).mockReturnValue({ valid: true });
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: true,
      remaining: 10,
      reset: Date.now() + 60000,
    });
    process.env.XAI_API_KEY = 'test-key';
  });

  it('returns 403 when CSRF token is invalid', async () => {
    (validateCsrfToken as jest.Mock).mockReturnValue({ valid: false });

    const response = await POST(createRequest({ symptoms: 'headache' }));
    expect(response.status).toBe(403);
  });

  it('returns 429 when rate limited', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
      retryAfter: 30,
    });

    const response = await POST(createRequest({ symptoms: 'headache' }));
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.retryAfter).toBe(30);
  });

  it('returns 400 when symptoms is missing', async () => {
    const response = await POST(createRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/symptoms are required/i);
  });

  it('returns 503 when XAI_API_KEY is not configured', async () => {
    delete process.env.XAI_API_KEY;

    const response = await POST(createRequest({ symptoms: 'headache' }));
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toMatch(/not configured/i);
  });

  it('returns follow-up questions on success', async () => {
    const questions = [{ id: 'q1', question: 'How long?', type: 'choice' }];
    (generateFollowUpQuestions as jest.Mock).mockResolvedValue(questions);

    const response = await POST(createRequest({ symptoms: 'headache' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.questions).toEqual(questions);
  });

  it('passes previousAnswers to generateFollowUpQuestions', async () => {
    (generateFollowUpQuestions as jest.Mock).mockResolvedValue([]);

    const previousAnswers = { q1: 'one week' };
    await POST(createRequest({ symptoms: 'headache', previousAnswers }));

    expect(generateFollowUpQuestions).toHaveBeenCalledWith('headache', previousAnswers);
  });

  it('returns 500 when grok throws', async () => {
    (generateFollowUpQuestions as jest.Mock).mockRejectedValue(new Error('API down'));
    jest.spyOn(console, 'error').mockImplementation();

    const response = await POST(createRequest({ symptoms: 'headache' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toMatch(/failed to generate/i);
    jest.restoreAllMocks();
  });
});
