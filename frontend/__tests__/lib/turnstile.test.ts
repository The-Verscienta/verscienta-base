/**
 * Tests for lib/turnstile.ts — Cloudflare Turnstile verification
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

function loadModule() {
  jest.resetModules();
  process.env.TURNSTILE_SECRET_KEY = 'test-secret-key';
  return require('@/lib/turnstile') as typeof import('@/lib/turnstile');
}

describe('lib/turnstile', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('verifyTurnstileToken', () => {
    it('sends token and secret to Cloudflare', async () => {
      const { verifyTurnstileToken } = loadModule();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await verifyTurnstileToken('user-token', '1.2.3.4');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.objectContaining({ method: 'POST' })
      );

      // Verify FormData contents
      const call = mockFetch.mock.calls[0];
      const body = call[1].body as FormData;
      expect(body.get('secret')).toBe('test-secret-key');
      expect(body.get('response')).toBe('user-token');
      expect(body.get('remoteip')).toBe('1.2.3.4');

      expect(result).toEqual({ success: true });
    });

    it('omits remoteip when not provided', async () => {
      const { verifyTurnstileToken } = loadModule();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await verifyTurnstileToken('token-only');

      const body = mockFetch.mock.calls[0][1].body as FormData;
      expect(body.get('remoteip')).toBeNull();
    });

    it('throws when secret key is not configured', async () => {
      jest.resetModules();
      delete process.env.TURNSTILE_SECRET_KEY;
      const mod = require('@/lib/turnstile') as typeof import('@/lib/turnstile');

      await expect(mod.verifyTurnstileToken('token'))
        .rejects.toThrow('Turnstile secret key not configured');
    });

    it('throws on non-ok HTTP response', async () => {
      const { verifyTurnstileToken } = loadModule();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      await expect(verifyTurnstileToken('bad-token'))
        .rejects.toThrow('Turnstile verification failed: Bad Request');
    });
  });

  describe('requireTurnstileVerification', () => {
    it('returns error when token is null', async () => {
      const { requireTurnstileVerification } = loadModule();

      const result = await requireTurnstileVerification(null);
      expect(result).toEqual({
        verified: false,
        error: 'CAPTCHA verification is required',
      });
    });

    it('returns error when token is undefined', async () => {
      const { requireTurnstileVerification } = loadModule();

      const result = await requireTurnstileVerification(undefined);
      expect(result).toEqual({
        verified: false,
        error: 'CAPTCHA verification is required',
      });
    });

    it('returns verified: true on success', async () => {
      const { requireTurnstileVerification } = loadModule();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await requireTurnstileVerification('valid-token', '1.2.3.4');
      expect(result).toEqual({ verified: true });
    });

    it('returns error when Cloudflare rejects token', async () => {
      const { requireTurnstileVerification } = loadModule();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
      });

      const result = await requireTurnstileVerification('bad-token');
      expect(result).toEqual({
        verified: false,
        error: 'CAPTCHA verification failed. Please try again.',
      });
    });

    it('returns error on fetch exception', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { requireTurnstileVerification } = loadModule();

      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const result = await requireTurnstileVerification('token');
      expect(result).toEqual({
        verified: false,
        error: 'CAPTCHA verification error. Please try again.',
      });

      consoleSpy.mockRestore();
    });
  });
});
