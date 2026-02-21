import { test, expect } from '@playwright/test';

test.describe('Symptom Checker', () => {
  test('renders the symptom input', async ({ page }) => {
    await page.goto('/symptom-checker');
    await expect(page.locator('h1')).toContainText(/symptom/i);
    const textarea = page.getByRole('textbox');
    await expect(textarea.first()).toBeVisible();
  });

  test('shows disclaimer', async ({ page }) => {
    await page.goto('/symptom-checker');
    await expect(page.locator('text=/not a substitute|educational|medical advice/i').first()).toBeVisible();
  });

  test('submit button exists', async ({ page }) => {
    await page.goto('/symptom-checker');
    const submitBtn = page.getByRole('button', { name: /analyze|submit|check/i });
    await expect(submitBtn).toBeVisible();
  });
});
