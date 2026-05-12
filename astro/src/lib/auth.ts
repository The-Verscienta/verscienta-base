/**
 * Directus Authentication Library
 *
 * Replaces frontend/lib/auth.ts (Drupal OAuth).
 * Uses Directus built-in auth endpoints.
 *
 * Changes from Next.js version:
 *   - Uses Directus /auth/* endpoints instead of Drupal /oauth/token
 *   - Uses import.meta.env instead of process.env
 *   - User type matches Directus schema, not Drupal
 */

import type { DirectusUser, AuthTokens } from "./directus";

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<AuthTokens> {
  const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.errors?.[0]?.message || "Authentication failed");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Refresh an access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  const response = await fetch(`${DIRECTUS_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken, mode: "json" }),
  });

  if (!response.ok) {
    throw new Error("Token refresh failed");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(accessToken: string): Promise<DirectusUser> {
  const response = await fetch(
    `${DIRECTUS_URL}/users/me?fields=id,first_name,last_name,email,email_verified,avatar,role.id,role.name,role.policies.policy.admin_access,policies.policy.admin_access`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Register a new user
 */
export async function registerUser(userData: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}): Promise<DirectusUser> {
  // Use Directus public registration endpoint (returns 204 No Content on success)
  const response = await fetch(`${DIRECTUS_URL}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.errors?.[0]?.message || "Registration failed");
  }

  // /users/register returns 204 with no body — return a minimal user object
  return { id: "", email: userData.email } as DirectusUser;
}

/**
 * Logout (revoke refresh token)
 */
export async function logoutUser(refreshToken: string): Promise<void> {
  await fetch(`${DIRECTUS_URL}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  }).catch(() => {
    // Logout failure is non-critical
  });
}
