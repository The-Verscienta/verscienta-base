/**
 * CSRF utility tests — ported from frontend/__tests__/lib/csrf.test.ts
 */
import { describe, it, expect } from "vitest";
import { generateCsrfToken, validateCsrfToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "../../src/lib/csrf";

describe("CSRF utilities", () => {
  describe("generateCsrfToken", () => {
    it("generates a 64-character hex string", () => {
      const token = generateCsrfToken();
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it("generates unique tokens", () => {
      const tokens = new Set(Array.from({ length: 10 }, () => generateCsrfToken()));
      expect(tokens.size).toBe(10);
    });
  });

  describe("validateCsrfToken", () => {
    it("allows GET requests without token", () => {
      const request = new Request("http://localhost/api/test", { method: "GET" });
      expect(validateCsrfToken(request)).toEqual({ valid: true });
    });

    it("allows OPTIONS requests without token", () => {
      const request = new Request("http://localhost/api/test", { method: "OPTIONS" });
      expect(validateCsrfToken(request)).toEqual({ valid: true });
    });

    it("rejects POST without cookie", () => {
      const request = new Request("http://localhost/api/test", { method: "POST" });
      const result = validateCsrfToken(request);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("cookie");
    });

    it("rejects POST without header", () => {
      const token = generateCsrfToken();
      const request = new Request("http://localhost/api/test", {
        method: "POST",
        headers: { cookie: `${CSRF_COOKIE_NAME}=${token}` },
      });
      const result = validateCsrfToken(request);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("header");
    });

    it("rejects mismatched tokens", () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      const request = new Request("http://localhost/api/test", {
        method: "POST",
        headers: {
          cookie: `${CSRF_COOKIE_NAME}=${token1}`,
          [CSRF_HEADER_NAME]: token2,
        },
      });
      const result = validateCsrfToken(request);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("mismatch");
    });

    it("accepts matching tokens", () => {
      const token = generateCsrfToken();
      const request = new Request("http://localhost/api/test", {
        method: "POST",
        headers: {
          cookie: `${CSRF_COOKIE_NAME}=${token}`,
          [CSRF_HEADER_NAME]: token,
        },
      });
      expect(validateCsrfToken(request)).toEqual({ valid: true });
    });
  });
});
