/**
 * Auth pages E2E tests — ported from frontend/e2e/auth.spec.ts
 */
import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("renders login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText(/welcome|sign in|login/i);
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("has register link", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /create account|register|sign up/i })).toBeVisible();
  });
});

test.describe("Register Page", () => {
  test("renders registration form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("h1")).toContainText(/create account|register/i);
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
  });

  test("has login link", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("link", { name: /sign in|login/i })).toBeVisible();
  });
});
