/**
 * Tests for lib/env.ts — Environment variable validation
 *
 * Uses jest.resetModules() because the module caches validated env.
 */

describe('lib/env', () => {
  const originalEnv = { ...process.env };

  function loadModule() {
    jest.resetModules();
    return require('@/lib/env') as typeof import('@/lib/env');
  }

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('validateServerEnv', () => {
    it('returns defaults with valid minimal env', () => {
      process.env.NODE_ENV = 'development';
      const { validateServerEnv } = loadModule();

      const env = validateServerEnv();
      expect(env.NODE_ENV).toBe('development');
      expect(env.DRUPAL_BASE_URL).toBe('http://localhost:8080');
    });

    it('accepts valid fully-configured env', () => {
      process.env.NODE_ENV = 'production';
      process.env.DRUPAL_BASE_URL = 'https://drupal.example.com';
      process.env.DRUPAL_CLIENT_ID = 'client-id';
      process.env.DRUPAL_CLIENT_SECRET = 'secret';
      process.env.XAI_API_KEY = 'xai-key';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.TURNSTILE_SECRET_KEY = 'turnstile-key';
      const { validateServerEnv } = loadModule();

      const env = validateServerEnv();
      expect(env.DRUPAL_BASE_URL).toBe('https://drupal.example.com');
      expect(env.DRUPAL_CLIENT_ID).toBe('client-id');
      expect(env.XAI_API_KEY).toBe('xai-key');
    });

    it('warns but continues in development mode with invalid env', () => {
      process.env.NODE_ENV = 'development';
      process.env.DRUPAL_BASE_URL = 'not-a-url';
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
      const { validateServerEnv } = loadModule();

      const env = validateServerEnv();
      expect(env.DRUPAL_BASE_URL).toBe('http://localhost:8080'); // fell back to default
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Continuing with default values')
      );

      consoleSpy.mockRestore();
      jest.restoreAllMocks();
    });

    it('throws in production mode with invalid env', () => {
      process.env.NODE_ENV = 'production';
      process.env.DRUPAL_BASE_URL = 'not-a-url';
      jest.spyOn(console, 'error').mockImplementation();
      const { validateServerEnv } = loadModule();

      expect(() => validateServerEnv()).toThrow('Invalid server environment configuration');

      jest.restoreAllMocks();
    });
  });

  describe('validateClientEnv', () => {
    it('returns empty/optional defaults with no env vars set', () => {
      process.env.NODE_ENV = 'development';
      const { validateClientEnv } = loadModule();

      const env = validateClientEnv();
      expect(env.NEXT_PUBLIC_ALGOLIA_APP_ID).toBeUndefined();
      expect(env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY).toBeUndefined();
    });

    it('returns populated values when set', () => {
      process.env.NODE_ENV = 'test';
      process.env.NEXT_PUBLIC_ALGOLIA_APP_ID = 'algolia-id';
      process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY = 'algolia-key';
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'turnstile-key';
      process.env.NEXT_PUBLIC_DRUPAL_BASE_URL = 'https://drupal.test';
      const { validateClientEnv } = loadModule();

      const env = validateClientEnv();
      expect(env.NEXT_PUBLIC_ALGOLIA_APP_ID).toBe('algolia-id');
      expect(env.NEXT_PUBLIC_DRUPAL_BASE_URL).toBe('https://drupal.test');
    });
  });

  describe('getServerEnv / getClientEnv caching', () => {
    it('caches server env on repeated calls', () => {
      process.env.NODE_ENV = 'development';
      const { getServerEnv } = loadModule();

      const env1 = getServerEnv();
      const env2 = getServerEnv();
      expect(env1).toBe(env2); // same reference
    });

    it('caches client env on repeated calls', () => {
      process.env.NODE_ENV = 'development';
      const { getClientEnv } = loadModule();

      const env1 = getClientEnv();
      const env2 = getClientEnv();
      expect(env1).toBe(env2);
    });
  });

  describe('featureFlags', () => {
    it('hasAlgolia returns true when both keys are set', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_ALGOLIA_APP_ID = 'id';
      process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY = 'key';
      const { featureFlags } = loadModule();

      expect(featureFlags.hasAlgolia()).toBe(true);
    });

    it('hasAlgolia returns false when keys are missing', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
      delete process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;
      const { featureFlags } = loadModule();

      expect(featureFlags.hasAlgolia()).toBe(false);
    });

    it('hasTurnstile returns true when site key is set', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'key';
      const { featureFlags } = loadModule();

      expect(featureFlags.hasTurnstile()).toBe(true);
    });

    it('hasAI returns true when XAI_API_KEY is set', () => {
      process.env.NODE_ENV = 'development';
      process.env.XAI_API_KEY = 'xai-key';
      const { featureFlags } = loadModule();

      expect(featureFlags.hasAI()).toBe(true);
    });

    it('hasRedis returns true when REDIS_URL is set', () => {
      process.env.NODE_ENV = 'development';
      process.env.REDIS_URL = 'redis://localhost:6379';
      const { featureFlags } = loadModule();

      expect(featureFlags.hasRedis()).toBe(true);
    });

    it('hasRedis returns false when REDIS_URL is missing', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.REDIS_URL;
      const { featureFlags } = loadModule();

      expect(featureFlags.hasRedis()).toBe(false);
    });
  });
});
