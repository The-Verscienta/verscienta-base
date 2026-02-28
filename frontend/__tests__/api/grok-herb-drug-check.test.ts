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
  checkHerbDrugInteractions: jest.fn(),
}));

import { POST } from '@/app/api/grok/herb-drug-check/route';
import { validateCsrfToken } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limit';
import { checkHerbDrugInteractions } from '@/lib/grok';

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/grok/herb-drug-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const mockInteractionResult = {
  interactions: [
    {
      herbName: 'Dang Gui',
      herbChineseName: '当归',
      medicationName: 'Warfarin',
      severity: 'contraindicated',
      mechanism: 'Coumarin compounds potentiate anticoagulant effects.',
      clinicalEffect: 'Increased bleeding risk',
      evidenceLevel: 'strong',
    },
  ],
  summary: 'Warfarin interacts with several TCM herbs.',
  checkedMedications: ['warfarin'],
  disclaimer: 'Consult your healthcare provider.',
};

describe('POST /api/grok/herb-drug-check', () => {
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

    const response = await POST(createRequest({ medications: 'warfarin' }));
    expect(response.status).toBe(403);
  });

  it('returns 429 when rate limited', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
      retryAfter: 60,
    });

    const response = await POST(createRequest({ medications: 'warfarin' }));
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toMatch(/rate limit/i);
  });

  it('returns 400 on validation failure (medications too short)', async () => {
    const response = await POST(createRequest({ medications: 'a' }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/validation/i);
  });

  it('returns 400 when medications field is missing', async () => {
    const response = await POST(createRequest({}));
    expect(response.status).toBe(400);
  });

  it('returns 503 when XAI_API_KEY is not configured', async () => {
    delete process.env.XAI_API_KEY;

    const response = await POST(createRequest({ medications: 'warfarin' }));
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.isConfigError).toBe(true);
  });

  it('returns interactions on valid request', async () => {
    (checkHerbDrugInteractions as jest.Mock).mockResolvedValueOnce(mockInteractionResult);

    const response = await POST(createRequest({ medications: 'warfarin, aspirin' }));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.interactions).toHaveLength(1);
    expect(data.interactions[0].herbName).toBe('Dang Gui');
    expect(data.interactions[0].severity).toBe('contraindicated');
    expect(data.summary).toBeTruthy();
  });

  it('passes parsed medication list to checkHerbDrugInteractions', async () => {
    (checkHerbDrugInteractions as jest.Mock).mockResolvedValueOnce({
      interactions: [],
      summary: 'No interactions.',
      checkedMedications: ['warfarin', 'aspirin'],
      disclaimer: 'Disclaimer.',
    });

    await POST(createRequest({ medications: 'warfarin, aspirin' }));

    expect(checkHerbDrugInteractions).toHaveBeenCalledWith(['warfarin', 'aspirin']);
  });

  it('returns 503 on xAI API error', async () => {
    (checkHerbDrugInteractions as jest.Mock).mockRejectedValueOnce(
      new Error('xAI API error: Unauthorized')
    );

    const response = await POST(createRequest({ medications: 'warfarin' }));
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.error).toMatch(/unavailable/i);
  });

  it('returns 500 on generic error', async () => {
    (checkHerbDrugInteractions as jest.Mock).mockRejectedValueOnce(
      new Error('Database connection failed')
    );

    const response = await POST(createRequest({ medications: 'warfarin' }));
    expect(response.status).toBe(500);
  });
});
