/**
 * Profile page E2E tests.
 *
 * Covers:
 * 1. Logged-out user is prompted to sign in.
 * 2. Changing first name is reflected on the dashboard greeting.
 * 3. Oversized avatar upload shows a friendly error.
 * 4. "Set as my practitioner" updates the profile page.
 *
 * Requires: DIRECTUS_TOKEN env var + running dev server + Directus instance.
 */
import { test, expect } from "@playwright/test";
import { createTestUser, type TestUser } from "./fixtures/users";

let user: TestUser;

test.beforeEach(async ({ page }) => {
  user = await createTestUser({ verified: true });
  // LoginForm uses id="login-email" and id="login-password"; submit button text is "Sign In".
  await page.goto("/login");
  await page.fill("#login-email", user.email);
  await page.fill("#login-password", user.password);
  await page.click('button[type="submit"]');
  // After a successful login LoginForm does window.location.href = "/dashboard".
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
});

test.afterEach(async () => {
  await user.cleanup();
});

test("redirects unauthenticated users to sign-in prompt", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/profile");
  await expect(page.getByText(/please sign in/i)).toBeVisible();
});

test("changes first name and reflects on dashboard greeting", async ({ page }) => {
  await page.goto("/profile");
  // Target the text input nearest to the "First name" label.
  await page.fill('input[type="text"]:near(:text("First name"))', "Alice");
  await page.click('button:has-text("Save name")');
  await expect(page.getByText(/saved/i)).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByText(/welcome back, alice/i)).toBeVisible();
});

test("rejects oversized avatar with friendly error", async ({ page }) => {
  await page.goto("/profile");
  // Inject a synthetic 3 MB JPEG via the first file input on the page.
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles({
    name: "big.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.alloc(3 * 1024 * 1024),
  });
  await expect(page.getByText(/file too large/i)).toBeVisible();
});

test("set-as-my-practitioner button updates profile", async ({ page }) => {
  // Navigate to the practitioners listing and click through to the first one.
  await page.goto("/practitioners");
  const firstLink = page.locator('a[href^="/practitioners/"]').first();
  await firstLink.click();

  // The "Set as my practitioner" button may be rendered inside a React / dynamic
  // island, so wait for it to appear before clicking.
  const setBtn = page.getByRole("button", { name: /set as my practitioner/i });
  await setBtn.waitFor({ state: "visible" });
  await setBtn.click();

  // Expect a confirmation message on the same page.
  await expect(page.getByText(/set as your practitioner/i)).toBeVisible();

  // Navigate to profile and confirm the practitioner section is shown.
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: /my practitioner/i })).toBeVisible();
  await expect(page.locator("text=Remove")).toBeVisible();
});
