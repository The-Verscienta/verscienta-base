/**
 * @jest-environment node
 */

/**
 * Tests for lib/verification-token.ts — HMAC-based email verification tokens
 */

describe('lib/verification-token', () => {
  function loadModule() {
    jest.resetModules();
    process.env.EMAIL_VERIFICATION_SECRET = 'test-secret-key-for-hmac';
    return require('@/lib/verification-token') as typeof import('@/lib/verification-token');
  }

  describe('generateVerificationToken', () => {
    it('returns a string in format timestamp.hmac', async () => {
      const { generateVerificationToken } = loadModule();
      const token = await generateVerificationToken('user-123');
      expect(token).toMatch(/^[0-9a-f]+\.[0-9a-f]+$/);
    });

    it('generates different tokens for different users', async () => {
      const { generateVerificationToken } = loadModule();
      const token1 = await generateVerificationToken('user-1');
      const token2 = await generateVerificationToken('user-2');
      expect(token1).not.toBe(token2);
    });

    it('throws when no secret is configured', async () => {
      jest.resetModules();
      delete process.env.EMAIL_VERIFICATION_SECRET;
      delete process.env.DRUPAL_CLIENT_SECRET;
      const mod = require('@/lib/verification-token');
      await expect(mod.generateVerificationToken('uid'))
        .rejects.toThrow(/EMAIL_VERIFICATION_SECRET|DRUPAL_CLIENT_SECRET/);
    });

    it('uses DRUPAL_CLIENT_SECRET as fallback', async () => {
      jest.resetModules();
      delete process.env.EMAIL_VERIFICATION_SECRET;
      process.env.DRUPAL_CLIENT_SECRET = 'fallback-secret';
      const mod = require('@/lib/verification-token');
      const token = await mod.generateVerificationToken('user-1');
      expect(token).toMatch(/^[0-9a-f]+\.[0-9a-f]+$/);
    });
  });

  describe('validateVerificationToken', () => {
    it('validates a freshly generated token', async () => {
      const { generateVerificationToken, validateVerificationToken } = loadModule();
      const token = await generateVerificationToken('user-abc');
      const result = await validateVerificationToken(token, 'user-abc');
      expect(result).toEqual({ valid: true });
    });

    it('rejects token for wrong user', async () => {
      const { generateVerificationToken, validateVerificationToken } = loadModule();
      const token = await generateVerificationToken('user-abc');
      const result = await validateVerificationToken(token, 'user-xyz');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
    });

    it('rejects malformed token (no dot)', async () => {
      const { validateVerificationToken } = loadModule();
      const result = await validateVerificationToken('notokenformat', 'user-1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Malformed token');
    });

    it('rejects token with invalid timestamp', async () => {
      const { validateVerificationToken } = loadModule();
      const result = await validateVerificationToken('zzzzz.abcdef1234', 'user-1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token timestamp');
    });

    it('rejects expired token (>24 hours)', async () => {
      const { generateVerificationToken, validateVerificationToken } = loadModule();
      const token = await generateVerificationToken('user-1');

      // Mock Date.now to be 25 hours in the future
      const realDateNow = Date.now;
      Date.now = () => realDateNow() + 25 * 60 * 60 * 1000;

      const result = await validateVerificationToken(token, 'user-1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token has expired');

      Date.now = realDateNow;
    });

    it('rejects token with tampered HMAC', async () => {
      const { generateVerificationToken, validateVerificationToken } = loadModule();
      const token = await generateVerificationToken('user-1');
      const [timestamp] = token.split('.');
      const tamperedToken = `${timestamp}.${'0'.repeat(64)}`;
      const result = await validateVerificationToken(tamperedToken, 'user-1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
    });
  });
});
