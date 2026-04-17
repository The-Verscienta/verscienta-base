/**
 * Validation schema tests
 */
import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, symptomAnalysisSchema, herbDrugCheckSchema, formatZodErrors } from "../../src/lib/validation";

describe("loginSchema", () => {
  it("accepts valid login", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "pass123" });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = loginSchema.safeParse({ password: "pass" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "pass" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validData = {
    username: "testuser",
    email: "test@example.com",
    password: "Password1",
    confirmPassword: "Password1",
    firstName: "Test",
    lastName: "User",
  };

  it("accepts valid registration", () => {
    expect(registerSchema.safeParse(validData).success).toBe(true);
  });

  it("rejects weak password", () => {
    expect(registerSchema.safeParse({ ...validData, password: "weak", confirmPassword: "weak" }).success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    expect(registerSchema.safeParse({ ...validData, confirmPassword: "Different1" }).success).toBe(false);
  });
});

describe("symptomAnalysisSchema", () => {
  it("accepts valid symptoms", () => {
    const result = symptomAnalysisSchema.safeParse({ symptoms: "I have headaches and fatigue" });
    expect(result.success).toBe(true);
  });

  it("rejects too-short symptoms", () => {
    const result = symptomAnalysisSchema.safeParse({ symptoms: "tired" });
    expect(result.success).toBe(false);
  });

  it("accepts optional context", () => {
    const result = symptomAnalysisSchema.safeParse({
      symptoms: "I have persistent headaches for two weeks",
      context: { age: 35, gender: "female" },
    });
    expect(result.success).toBe(true);
  });
});

describe("herbDrugCheckSchema", () => {
  it("accepts valid medications", () => {
    const result = herbDrugCheckSchema.safeParse({ medications: "Warfarin, Metformin" });
    expect(result.success).toBe(true);
  });

  it("rejects empty medications", () => {
    const result = herbDrugCheckSchema.safeParse({ medications: "" });
    expect(result.success).toBe(false);
  });
});

describe("formatZodErrors", () => {
  it("formats errors into a record", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    if (!result.success) {
      const formatted = formatZodErrors(result.error);
      expect(typeof formatted).toBe("object");
      expect(Object.keys(formatted).length).toBeGreaterThan(0);
    }
  });
});
