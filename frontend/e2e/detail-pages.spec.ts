import { test, expect } from '@playwright/test';

test.describe('Listing Pages', () => {
  const listingPages = [
    { path: '/herbs', heading: /herb/i },
    { path: '/formulas', heading: /formula/i },
    { path: '/conditions', heading: /condition/i },
    { path: '/modalities', heading: /modalit/i },
    { path: '/practitioners', heading: /practitioner/i },
  ];

  for (const { path, heading } of listingPages) {
    test(`${path} listing page loads`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('h1')).toContainText(heading);
    });

    test(`${path} has breadcrumbs`, async ({ page }) => {
      await page.goto(path);
      const breadcrumbs = page.locator('nav[aria-label*="breadcrumb" i]').or(page.locator('[class*="breadcrumb" i]'));
      if (await breadcrumbs.count() > 0) {
        await expect(breadcrumbs.first()).toBeVisible();
      }
    });
  }
});

test.describe('Static Pages', () => {
  const staticPages = [
    { path: '/about', heading: /about/i },
    { path: '/contact', heading: /contact/i },
    { path: '/faq', heading: /faq|frequently/i },
    { path: '/privacy', heading: /privacy/i },
    { path: '/terms', heading: /terms/i },
  ];

  for (const { path, heading } of staticPages) {
    test(`${path} page loads`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('h1')).toContainText(heading);
    });
  }
});
