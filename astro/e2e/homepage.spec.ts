/**
 * Homepage E2E tests — ported from frontend/e2e/homepage.spec.ts
 */
import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("renders the hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText(/ancient wisdom|verscienta/i);
  });

  test("has working navigation links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /herbs/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /formulas/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /conditions/i }).first()).toBeVisible();
  });

  test("navigates to herbs page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /explore herbs/i }).first().click();
    await expect(page).toHaveURL(/\/herbs/);
    await expect(page.locator("h1")).toContainText(/herb/i);
  });

  test("has skip-to-content link", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: /skip to content/i });
    await expect(skipLink).toBeFocused();
  });

  test("displays feature cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/symptom checker/i).first()).toBeVisible();
    await expect(page.getByText(/drug interaction/i).first()).toBeVisible();
    await expect(page.getByText(/search database/i).first()).toBeVisible();
  });
});
