/**
 * @jest-environment node
 */

const originalFetch = global.fetch;
const originalEnv = { ...process.env };

function loadModule() {
  // Must reset modules each time so module-level consts re-read env
  jest.resetModules();
  return require('@/lib/sympy-compute') as typeof import('@/lib/sympy-compute');
}

beforeAll(() => {
  global.fetch = jest.fn();
});

afterAll(() => {
  global.fetch = originalFetch;
  process.env = originalEnv;
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SYMPY_SERVICE_URL = 'http://test-sympy:8001';
  process.env.SYMPY_API_KEY = 'test-api-key';
});

describe('computeSymbolic', () => {
  it('sends correct request with API key header', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        result: '4',
        latex: '4',
        numeric: 4,
        unit: null,
        cached: false,
      }),
    });

    const { computeSymbolic } = loadModule();
    await computeSymbolic({
      operation: 'simplify',
      expression: '2 + 2',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://test-sympy:8001/compute',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key',
        }),
      })
    );
  });

  it('returns parsed response on success', async () => {
    const mockResponse = {
      result: 'x**2',
      latex: 'x^{2}',
      numeric: null,
      unit: null,
      cached: true,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { computeSymbolic } = loadModule();
    const result = await computeSymbolic({
      operation: 'simplify',
      expression: 'x*x',
    });

    expect(result).toEqual(mockResponse);
  });

  it('throws on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ detail: 'Invalid expression' }),
    });

    const { computeSymbolic } = loadModule();
    await expect(
      computeSymbolic({ operation: 'simplify', expression: 'invalid' })
    ).rejects.toThrow('Invalid expression');
  });

  it('throws on non-ok response with unparseable body', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('parse error')),
    });

    const { computeSymbolic } = loadModule();
    await expect(
      computeSymbolic({ operation: 'simplify', expression: 'x' })
    ).rejects.toThrow('Internal Server Error');
  });

  it('throws when SYMPY_API_KEY is not set', async () => {
    delete process.env.SYMPY_API_KEY;
    const { computeSymbolic } = loadModule();

    await expect(
      computeSymbolic({ operation: 'simplify', expression: 'x' })
    ).rejects.toThrow('SYMPY_API_KEY is not configured');
  });
});

describe('computeDosage', () => {
  it('sends correct request to /dosage endpoint', async () => {
    const mockResponse = {
      daily_dose_mg: 300,
      per_dose_mg: 100,
      doses_per_day: 3,
      within_safety_limits: true,
      constraint_details: [],
      latex: '300 \\text{ mg/day}',
      cached: false,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { computeDosage } = loadModule();
    const result = await computeDosage({
      herb_name: 'Ginseng',
      body_weight_kg: 70,
      dose_per_kg_mg: 4.3,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://test-sympy:8001/dosage',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.daily_dose_mg).toBe(300);
    expect(result.within_safety_limits).toBe(true);
  });

  it('throws on error response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Unprocessable Entity',
      json: () => Promise.resolve({ detail: 'Missing herb_name' }),
    });

    const { computeDosage } = loadModule();
    await expect(
      computeDosage({
        herb_name: '',
        body_weight_kg: 70,
        dose_per_kg_mg: 4.3,
      })
    ).rejects.toThrow('Missing herb_name');
  });

  it('throws when SYMPY_API_KEY is not set', async () => {
    delete process.env.SYMPY_API_KEY;
    const { computeDosage } = loadModule();

    await expect(
      computeDosage({ herb_name: 'Test', body_weight_kg: 70, dose_per_kg_mg: 1 })
    ).rejects.toThrow('SYMPY_API_KEY is not configured');
  });
});

describe('checkSymPyHealth', () => {
  it('returns health data on success', async () => {
    const mockHealth = {
      status: 'healthy',
      sympy_version: '1.12',
      cache_connected: true,
      uptime_seconds: 3600,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockHealth),
    });

    const { checkSymPyHealth } = loadModule();
    const result = await checkSymPyHealth();

    expect(global.fetch).toHaveBeenCalledWith('http://test-sympy:8001/health');
    expect(result.status).toBe('healthy');
    expect(result.cache_connected).toBe(true);
  });

  it('throws on health check failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Service Unavailable',
    });

    const { checkSymPyHealth } = loadModule();
    await expect(checkSymPyHealth()).rejects.toThrow('Service Unavailable');
  });
});
