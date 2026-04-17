/**
 * Symptom Checker E2E tests — ported from frontend/e2e/symptom-checker.spec.ts
 */
import { test, expect } from "@playwright/test";

test.describe("Symptom Checker", () => {
  test("renders the page with input", async ({ page }) => {
    await page.goto("/symptom-checker");
    await expect(page.locator("h1")).toContainText(/symptom/i);
    const textarea = page.getByRole("textbox");
    await expect(textarea.first()).toBeVisible();
  });

  test("shows disclaimer", async ({ page }) => {
    await page.goto("/symptom-checker");
    await expect(
      page.locator("text=/educational|medical advice|not a substitute|disclaimer/i").first()
    ).toBeVisible();
  });

  test("has analyze button", async ({ page }) => {
    await page.goto("/symptom-checker");
    const btn = page.getByRole("button", { name: /analyze|submit|check/i });
    await expect(btn).toBeVisible();
  });

  test("button is disabled when textarea is empty", async ({ page }) => {
    await page.goto("/symptom-checker");
    const btn = page.getByRole("button", { name: /analyze/i });
    await expect(btn).toBeDisabled();
  });
});
