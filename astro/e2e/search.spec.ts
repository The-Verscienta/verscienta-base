/**
 * Search page E2E tests
 */
import { test, expect } from "@playwright/test";

test.describe("Search Page", () => {
  test("renders search page", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator("h1")).toContainText(/search/i);
  });

  test("has search input", async ({ page }) => {
    await page.goto("/search");
    const input = page.getByRole("searchbox").or(page.getByPlaceholder(/search/i));
    await expect(input.first()).toBeVisible();
  });
});
