import { describe, it, expect } from "vitest";
import { RATE_LIMITS } from "../../src/lib/rate-limit";

describe("RATE_LIMITS.verification", () => {
  it("allows 3 attempts per hour", () => {
    expect(RATE_LIMITS.verification).toEqual({
      interval: 60 * 60 * 1000,
      maxRequests: 3,
    });
  });
});
