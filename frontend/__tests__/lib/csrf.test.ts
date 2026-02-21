/**
 * @jest-environment node
 */
import { generateCsrfToken, validateCsrfToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/csrf';

describe('CSRF Token Utilities', () => {
  describe('generateCsrfToken', () => {
    it('generates a 64-character hex string', () => {
      const token = generateCsrfToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('generates unique tokens each time', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('validateCsrfToken', () => {
    it('allows GET requests without token', () => {
      const request = new Request('http://localhost/api/test', { method: 'GET' });
      const result = validateCsrfToken(request);
      expect(result.valid).toBe(true);
    });

    it('allows HEAD requests without token', () => {
      const request = new Request('http://localhost/api/test', { method: 'HEAD' });
      const result = validateCsrfToken(request);
      expect(result.valid).toBe(true);
    });

    it('allows OPTIONS requests without token', () => {
      const request = new Request('http://localhost/api/test', { method: 'OPTIONS' });
      const result = validateCsrfToken(request);
      expect(result.valid).toBe(true);
    });

    it('rejects POST without CSRF cookie', () => {
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { [CSRF_HEADER_NAME]: 'some-token' },
      });
      const result = validateCsrfToken(request);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('CSRF cookie missing');
    });

    it('rejects POST without CSRF header', () => {
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { cookie: `${CSRF_COOKIE_NAME}=some-token` },
      });
      const result = validateCsrfToken(request);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('CSRF token header missing');
    });

    it('rejects POST with mismatched tokens', () => {
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: {
          cookie: `${CSRF_COOKIE_NAME}=token-a`,
          [CSRF_HEADER_NAME]: 'token-b',
        },
      });
      const result = validateCsrfToken(request);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('CSRF token mismatch');
    });

    it('accepts POST with matching tokens', () => {
      const token = generateCsrfToken();
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: {
          cookie: `${CSRF_COOKIE_NAME}=${token}`,
          [CSRF_HEADER_NAME]: token,
        },
      });
      const result = validateCsrfToken(request);
      expect(result.valid).toBe(true);
    });

    it('validates PATCH requests', () => {
      const token = generateCsrfToken();
      const request = new Request('http://localhost/api/test', {
        method: 'PATCH',
        headers: {
          cookie: `${CSRF_COOKIE_NAME}=${token}`,
          [CSRF_HEADER_NAME]: token,
        },
      });
      const result = validateCsrfToken(request);
      expect(result.valid).toBe(true);
    });

    it('validates DELETE requests', () => {
      const request = new Request('http://localhost/api/test', {
        method: 'DELETE',
      });
      const result = validateCsrfToken(request);
      expect(result.valid).toBe(false);
    });
  });
});
