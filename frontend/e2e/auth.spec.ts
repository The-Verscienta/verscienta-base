import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('login page renders form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('login shows validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page.locator('text=/required|enter/i').first()).toBeVisible();
  });

  test('register page renders form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('login page has link to register', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.getByRole('link', { name: /register|sign up|create account/i });
    await expect(registerLink).toBeVisible();
  });

  test('register page has link to login', async ({ page }) => {
    await page.goto('/register');
    const loginLink = page.getByRole('link', { name: /sign in|log in/i });
    await expect(loginLink).toBeVisible();
  });
});
