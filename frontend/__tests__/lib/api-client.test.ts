import { apiFetch } from '@/lib/api-client';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/csrf';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('api-client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    // Clear cookies
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  describe('apiFetch', () => {
    it('makes GET requests without CSRF header', async () => {
      await apiFetch('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );

      const headers = mockFetch.mock.calls[0][1].headers as Headers;
      expect(headers.has(CSRF_HEADER_NAME)).toBe(false);
    });

    it('adds CSRF header for POST requests when cookie exists', async () => {
      document.cookie = `${CSRF_COOKIE_NAME}=test-csrf-token-123`;

      await apiFetch('/api/test', { method: 'POST', body: '{}' });

      const headers = mockFetch.mock.calls[0][1].headers as Headers;
      expect(headers.get(CSRF_HEADER_NAME)).toBe('test-csrf-token-123');
    });

    it('adds CSRF header for PUT requests', async () => {
      document.cookie = `${CSRF_COOKIE_NAME}=csrf-put`;

      await apiFetch('/api/test', { method: 'PUT', body: '{}' });

      const headers = mockFetch.mock.calls[0][1].headers as Headers;
      expect(headers.get(CSRF_HEADER_NAME)).toBe('csrf-put');
    });

    it('adds CSRF header for DELETE requests', async () => {
      document.cookie = `${CSRF_COOKIE_NAME}=csrf-del`;

      await apiFetch('/api/test', { method: 'DELETE' });

      const headers = mockFetch.mock.calls[0][1].headers as Headers;
      expect(headers.get(CSRF_HEADER_NAME)).toBe('csrf-del');
    });

    it('adds CSRF header for PATCH requests', async () => {
      document.cookie = `${CSRF_COOKIE_NAME}=csrf-patch`;

      await apiFetch('/api/test', { method: 'PATCH', body: '{}' });

      const headers = mockFetch.mock.calls[0][1].headers as Headers;
      expect(headers.get(CSRF_HEADER_NAME)).toBe('csrf-patch');
    });

    it('does not add CSRF header when cookie is missing', async () => {
      document.cookie = '';

      await apiFetch('/api/test', { method: 'POST', body: '{}' });

      const headers = mockFetch.mock.calls[0][1].headers as Headers;
      expect(headers.has(CSRF_HEADER_NAME)).toBe(false);
    });

    it('sets Content-Type to application/json when body is present', async () => {
      await apiFetch('/api/test', { method: 'POST', body: JSON.stringify({ key: 'val' }) });

      const headers = mockFetch.mock.calls[0][1].headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('does not override existing Content-Type', async () => {
      await apiFetch('/api/test', {
        method: 'POST',
        body: 'form-data',
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const headers = mockFetch.mock.calls[0][1].headers as Headers;
      expect(headers.get('Content-Type')).toBe('multipart/form-data');
    });

    it('preserves other custom headers', async () => {
      await apiFetch('/api/test', {
        headers: { 'X-Custom': 'hello' },
      });

      const headers = mockFetch.mock.calls[0][1].headers as Headers;
      expect(headers.get('X-Custom')).toBe('hello');
    });

    it('handles case-insensitive method matching', async () => {
      document.cookie = `${CSRF_COOKIE_NAME}=token`;

      await apiFetch('/api/test', { method: 'post', body: '{}' });

      const headers = mockFetch.mock.calls[0][1].headers as Headers;
      expect(headers.get(CSRF_HEADER_NAME)).toBe('token');
    });
  });
});
