import { renderHook, act, waitFor } from '@testing-library/react';
import { useSymbolicVerification } from '@/hooks/useSymbolicVerification';

// Mock apiFetch
const mockFetch = jest.fn();
jest.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => mockFetch(...args),
}));

describe('useSymbolicVerification', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('starts with idle state', () => {
    const { result } = renderHook(() => useSymbolicVerification());
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('returns result on successful verification', async () => {
    const mockResult = {
      daily_dose_mg: 350,
      per_dose_mg: 116.7,
      doses_per_day: 3,
      within_safety_limits: true,
      constraint_details: [],
      latex: 'dose = 5 \\times 70',
      cached: false,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    });

    const { result } = renderHook(() => useSymbolicVerification());

    await act(async () => {
      await result.current.verify({
        herb_name: 'Ginger',
        body_weight_kg: 70,
        dose_per_kg_mg: 5,
      });
    });

    await waitFor(() => {
      expect(result.current.result).toEqual(mockResult);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  it('returns error on failed response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Service unavailable' }),
    });

    const { result } = renderHook(() => useSymbolicVerification());

    await act(async () => {
      try {
        await result.current.verify({
          herb_name: 'Ginger',
          body_weight_kg: 70,
          dose_per_kg_mg: 5,
        });
      } catch {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Service unavailable');
      expect(result.current.result).toBeNull();
    });
  });

  it('returns generic error when JSON parsing fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error('parse error'); },
    });

    const { result } = renderHook(() => useSymbolicVerification());

    await act(async () => {
      try {
        await result.current.verify({
          herb_name: 'Ginger',
          body_weight_kg: 70,
          dose_per_kg_mg: 5,
        });
      } catch {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Request failed (500)');
    });
  });

  it('resets state with reset()', async () => {
    const mockResult = {
      daily_dose_mg: 350,
      per_dose_mg: 116.7,
      doses_per_day: 3,
      within_safety_limits: true,
      constraint_details: [],
      latex: '',
      cached: false,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    });

    const { result } = renderHook(() => useSymbolicVerification());

    await act(async () => {
      await result.current.verify({
        herb_name: 'Ginger',
        body_weight_kg: 70,
        dose_per_kg_mg: 5,
      });
    });

    await waitFor(() => {
      expect(result.current.result).not.toBeNull();
    });

    act(() => {
      result.current.reset();
    });

    await waitFor(() => {
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  it('sends correct payload to API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        daily_dose_mg: 350,
        per_dose_mg: 116.7,
        doses_per_day: 3,
        within_safety_limits: true,
        constraint_details: [],
        latex: '',
        cached: false,
      }),
    });

    const { result } = renderHook(() => useSymbolicVerification());

    const payload = {
      herb_name: 'Ginger',
      body_weight_kg: 70,
      dose_per_kg_mg: 5,
      age_years: 35,
      constraints: { max_daily_mg: 2000 },
    };

    await act(async () => {
      await result.current.verify(payload);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/symbolic-compute', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  });
});
