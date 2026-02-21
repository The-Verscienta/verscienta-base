/**
 * @jest-environment node
 */
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  describe('checkRateLimit', () => {
    it('allows requests under the limit', () => {
      const result = checkRateLimit('test-rate-1', { interval: 60000, maxRequests: 5 });
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('tracks remaining requests', () => {
      const key = `test-rate-track-${Date.now()}`;
      const config = { interval: 60000, maxRequests: 3 };

      const r1 = checkRateLimit(key, config);
      expect(r1.remaining).toBe(2);

      const r2 = checkRateLimit(key, config);
      expect(r2.remaining).toBe(1);

      const r3 = checkRateLimit(key, config);
      expect(r3.remaining).toBe(0);
    });

    it('blocks requests over the limit', () => {
      const key = `test-rate-block-${Date.now()}`;
      const config = { interval: 60000, maxRequests: 2 };

      checkRateLimit(key, config);
      checkRateLimit(key, config);
      const result = checkRateLimit(key, config);

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('getClientIdentifier', () => {
    it('uses x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
      });
      expect(getClientIdentifier(request)).toBe('1.2.3.4');
    });

    it('uses x-real-ip as fallback', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '9.8.7.6' },
      });
      expect(getClientIdentifier(request)).toBe('9.8.7.6');
    });

    it('returns unknown when no IP headers', () => {
      const request = new Request('http://localhost');
      expect(getClientIdentifier(request)).toBe('unknown');
    });
  });

  describe('RATE_LIMITS constants', () => {
    it('has auth config', () => {
      expect(RATE_LIMITS.auth.maxRequests).toBe(10);
      expect(RATE_LIMITS.auth.interval).toBe(15 * 60 * 1000);
    });

    it('has api config', () => {
      expect(RATE_LIMITS.api.maxRequests).toBe(60);
    });

    it('has ai config', () => {
      expect(RATE_LIMITS.ai.maxRequests).toBe(10);
    });
  });
});
