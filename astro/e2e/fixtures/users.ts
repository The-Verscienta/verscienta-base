/**
 * Test user creation helpers for Playwright.
 * Uses the Directus admin token (DIRECTUS_TOKEN env var) to create + clean up users.
 */
const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

const PATIENT_ROLE_ID = "2f72336d-c7d5-4c8d-a127-301f687db060";

export interface TestUser {
  id: string;
  email: string;
  password: string;
  cleanup: () => Promise<void>;
}

export async function createTestUser({ verified = true }: { verified?: boolean } = {}): Promise<TestUser> {
  if (!DIRECTUS_TOKEN) throw new Error("DIRECTUS_TOKEN env var required for E2E tests.");
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;
  const password = "TestPass123!";

  const res = await fetch(`${DIRECTUS_URL}/users`, {
    method: "POST",
    headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      first_name: "E2E",
      last_name: "Test",
      role: PATIENT_ROLE_ID,
      email_verified: verified,
      status: "active",
    }),
  });
  if (!res.ok) throw new Error(`Failed to create test user: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const id = json.data.id;

  return {
    id,
    email,
    password,
    cleanup: async () => {
      await fetch(`${DIRECTUS_URL}/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
      });
    },
  };
}
