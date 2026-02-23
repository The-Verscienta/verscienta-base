import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useAuth', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('starts in loading state', () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Not authenticated' }),
    });

    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('sets user when /api/auth/me returns a user', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'testuser',
      mail: 'test@example.com',
      roles: ['authenticated'],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/me');
  });

  it('sets user to null when /api/auth/me returns non-ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Not authenticated' }),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles fetch error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Auth check failed:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('logout calls /api/auth/logout and clears user', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'testuser',
      roles: ['authenticated'],
    };

    // Initial auth check succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    // Logout call succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // jsdom throws "Not implemented: navigation" for window.location.href assignment;
    // suppress that so the test can verify the important behavior
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await act(async () => {
      await result.current.logout();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
    expect(result.current.user).toBeNull();
    consoleSpy.mockRestore();
  });

  it('logout handles fetch errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // Initial auth check — not authenticated
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Not authenticated' }),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Logout fetch fails
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      await result.current.logout();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('refreshAuth re-fetches user data', async () => {
    // Initial: not authenticated
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Not authenticated' }),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);

    // After login elsewhere, refreshAuth detects the new session
    const mockUser = {
      id: 'user-456',
      name: 'newuser',
      roles: ['authenticated'],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    await act(async () => {
      await result.current.refreshAuth();
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('exposes isAuthenticated as a derived boolean', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: '1', name: 'a', roles: [] },
      }),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(typeof result.current.isAuthenticated).toBe('boolean');
  });
});
