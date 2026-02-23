/**
 * Tests for lib/auth.ts — Drupal OAuth authentication functions
 *
 * Uses jest.resetModules() + dynamic require() because the module reads
 * env vars (DRUPAL_BASE_URL, CLIENT_ID, CLIENT_SECRET) at import time.
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

function loadModule() {
  jest.resetModules();
  process.env.NEXT_PUBLIC_DRUPAL_BASE_URL = 'https://drupal.test';
  process.env.DRUPAL_CLIENT_ID = 'test-client-id';
  process.env.DRUPAL_CLIENT_SECRET = 'test-client-secret';
  return require('@/lib/auth') as typeof import('@/lib/auth');
}

describe('lib/auth', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('authenticateUser', () => {
    it('sends correct OAuth password grant request', async () => {
      const { authenticateUser } = loadModule();

      const mockTokens = {
        access_token: 'abc123',
        refresh_token: 'def456',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokens,
      });

      const result = await authenticateUser('testuser', 'password123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://drupal.test/oauth/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );

      // Verify body params
      const call = mockFetch.mock.calls[0];
      const body = call[1].body as URLSearchParams;
      expect(body.get('grant_type')).toBe('password');
      expect(body.get('client_id')).toBe('test-client-id');
      expect(body.get('username')).toBe('testuser');
      expect(body.get('password')).toBe('password123');

      expect(result).toEqual(mockTokens);
    });

    it('throws error on failed authentication', async () => {
      const { authenticateUser } = loadModule();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error_description: 'Invalid credentials' }),
      });

      await expect(authenticateUser('bad', 'creds'))
        .rejects.toThrow('Invalid credentials');
    });

    it('throws generic error when no error_description', async () => {
      const { authenticateUser } = loadModule();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(authenticateUser('user', 'pass'))
        .rejects.toThrow('Authentication failed');
    });
  });

  describe('refreshAccessToken', () => {
    it('sends correct refresh token request', async () => {
      const { refreshAccessToken } = loadModule();

      const mockTokens = {
        access_token: 'new-token',
        refresh_token: 'new-refresh',
        expires_in: 3600,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokens,
      });

      const result = await refreshAccessToken('old-refresh-token');

      const call = mockFetch.mock.calls[0];
      const body = call[1].body as URLSearchParams;
      expect(body.get('grant_type')).toBe('refresh_token');
      expect(body.get('refresh_token')).toBe('old-refresh-token');
      expect(result).toEqual(mockTokens);
    });

    it('throws on failed token refresh', async () => {
      const { refreshAccessToken } = loadModule();

      mockFetch.mockResolvedValueOnce({ ok: false });

      await expect(refreshAccessToken('expired-token'))
        .rejects.toThrow('Token refresh failed');
    });
  });

  describe('getCurrentUser', () => {
    it('sends Bearer token and returns user data', async () => {
      const { getCurrentUser } = loadModule();

      const mockUser = {
        id: 'user-1',
        type: 'user--user',
        attributes: { name: 'testuser' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUser }),
      });

      const result = await getCurrentUser('my-access-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://drupal.test/jsonapi/current_user',
        {
          headers: {
            Authorization: 'Bearer my-access-token',
            'Content-Type': 'application/vnd.api+json',
          },
        }
      );
      expect(result).toEqual(mockUser);
    });

    it('throws on failed user fetch', async () => {
      const { getCurrentUser } = loadModule();

      mockFetch.mockResolvedValueOnce({ ok: false });

      await expect(getCurrentUser('bad-token'))
        .rejects.toThrow('Failed to fetch user data');
    });
  });

  describe('registerUser', () => {
    it('sends correct JSON:API user creation request', async () => {
      const { registerUser } = loadModule();

      const mockCreatedUser = {
        id: 'new-user-1',
        type: 'user--user',
        attributes: { name: 'newuser', mail: 'new@example.com' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCreatedUser }),
      });

      const result = await registerUser({
        name: 'newuser',
        mail: 'new@example.com',
        pass: 'securePass123',
        field_first_name: 'New',
        field_last_name: 'User',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://drupal.test/jsonapi/user/user',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json',
          },
        })
      );

      // Verify body structure
      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.data.type).toBe('user--user');
      expect(body.data.attributes.name).toBe('newuser');
      expect(body.data.attributes.mail).toBe('new@example.com');
      expect(body.data.attributes.pass).toBe('securePass123');
      expect(body.data.attributes.field_first_name).toBe('New');

      expect(result).toEqual(mockCreatedUser);
    });

    it('throws error with detail from Drupal errors', async () => {
      const { registerUser } = loadModule();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          errors: [{ detail: 'The username is already taken.' }],
        }),
      });

      await expect(
        registerUser({ name: 'taken', mail: 'a@b.com', pass: 'pass' })
      ).rejects.toThrow('The username is already taken.');
    });

    it('throws generic error when no error detail', async () => {
      const { registerUser } = loadModule();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(
        registerUser({ name: 'u', mail: 'a@b.com', pass: 'p' })
      ).rejects.toThrow('Registration failed');
    });
  });

  describe('logoutUser', () => {
    it('is a no-op function (tokens expire naturally)', async () => {
      const { logoutUser } = loadModule();
      // Should not throw
      await expect(logoutUser('some-token')).resolves.toBeUndefined();
    });
  });
});
