import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('renders the hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('has working navigation links', async ({ page }) => {
    await page.goto('/');

    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible();

    await expect(nav.getByRole('link', { name: /herbs/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /formulas/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /conditions/i })).toBeVisible();
  });

  test('navigates to herbs page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /herbs/i }).first().click();
    await expect(page).toHaveURL(/\/herbs/);
    await expect(page.locator('h1')).toContainText(/herb/i);
  });

  test('skip to content link works', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: /skip to main content/i });
    await expect(skipLink).toBeFocused();
  });
});
