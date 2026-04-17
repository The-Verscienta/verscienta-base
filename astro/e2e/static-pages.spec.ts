/**
 * Static pages E2E tests — verify all static pages render correctly
 */
import { test, expect } from "@playwright/test";

const staticPages = [
  { path: "/about", heading: /about/i },
  { path: "/contact", heading: /contact/i },
  { path: "/faq", heading: /faq|frequently/i },
  { path: "/privacy", heading: /privacy/i },
  { path: "/terms", heading: /terms/i },
];

for (const { path, heading } of staticPages) {
  test(`${path} renders correctly`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1")).toContainText(heading);
    // Should have footer
    await expect(page.locator("footer")).toBeVisible();
  });
}
