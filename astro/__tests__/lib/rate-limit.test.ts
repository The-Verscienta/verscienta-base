/**
 * Rate limiter tests
 */
import { describe, it, expect } from "vitest";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "../../src/lib/rate-limit";

describe("Rate limiter", () => {
  it("allows requests under the limit", () => {
    const result = checkRateLimit("test:under-limit:" + Date.now(), { interval: 60000, maxRequests: 5 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests over the limit", () => {
    const key = "test:over-limit:" + Date.now();
    const config = { interval: 60000, maxRequests: 3 };

    checkRateLimit(key, config);
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const result = checkRateLimit(key, config);

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("tracks remaining correctly", () => {
    const key = "test:remaining:" + Date.now();
    const config = { interval: 60000, maxRequests: 5 };

    const r1 = checkRateLimit(key, config);
    expect(r1.remaining).toBe(4);

    const r2 = checkRateLimit(key, config);
    expect(r2.remaining).toBe(3);
  });

  describe("getClientIdentifier", () => {
    it("extracts from cf-connecting-ip", () => {
      const req = new Request("http://localhost", { headers: { "cf-connecting-ip": "1.2.3.4" } });
      expect(getClientIdentifier(req)).toBe("1.2.3.4");
    });

    it("extracts from x-forwarded-for", () => {
      const req = new Request("http://localhost", { headers: { "x-forwarded-for": "5.6.7.8, 10.0.0.1" } });
      expect(getClientIdentifier(req)).toBe("5.6.7.8");
    });

    it("returns unknown as fallback", () => {
      const req = new Request("http://localhost");
      expect(getClientIdentifier(req)).toBe("unknown");
    });
  });

  describe("createRateLimitHeaders", () => {
    it("includes remaining and reset", () => {
      const headers = createRateLimitHeaders({ success: true, remaining: 5, reset: 1234567890 });
      expect(headers["X-RateLimit-Remaining"]).toBe("5");
      expect(headers["X-RateLimit-Reset"]).toBe("1234567890");
    });

    it("includes Retry-After on failure", () => {
      const headers = createRateLimitHeaders({ success: false, remaining: 0, reset: 123, retryAfter: 30 });
      expect(headers["Retry-After"]).toBe("30");
    });
  });

  describe("RATE_LIMITS presets", () => {
    it("has expected presets", () => {
      expect(RATE_LIMITS.auth.maxRequests).toBe(10);
      expect(RATE_LIMITS.ai.maxRequests).toBe(10);
      expect(RATE_LIMITS.api.maxRequests).toBe(60);
      expect(RATE_LIMITS.search.maxRequests).toBe(30);
      expect(RATE_LIMITS.symbolic.maxRequests).toBe(15);
    });
  });
});
