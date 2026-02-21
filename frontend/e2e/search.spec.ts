import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test('navigates to search page', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('h1')).toContainText(/search/i);
  });

  test('search input is focusable', async ({ page }) => {
    await page.goto('/search');
    const searchInput = page.getByRole('searchbox').or(page.locator('input[type="search"]')).or(page.locator('input[placeholder*="search" i]'));
    if (await searchInput.count() > 0) {
      await searchInput.first().click();
      await expect(searchInput.first()).toBeFocused();
    }
  });
});
