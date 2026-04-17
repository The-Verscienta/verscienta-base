/**
 * Directus SDK Client
 *
 * Replaces the next-drupal client from frontend/lib/drupal.ts.
 * Provides a typed Directus client for all data fetching.
 */

import { createDirectus, rest, staticToken, readItems, readItem } from "@directus/sdk";

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";
const DIRECTUS_TOKEN = import.meta.env.DIRECTUS_TOKEN;

/**
 * Server-side Directus client (authenticated with static token)
 * Use this in .astro pages and API routes.
 */
export const directus = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with(staticToken(DIRECTUS_TOKEN || ""));

/**
 * Public Directus client (unauthenticated)
 * Use this for client-side fetches where no auth is needed.
 */
export const directusPublic = createDirectus(DIRECTUS_URL).with(rest());

/**
 * Re-export SDK functions for convenience
 */
export { readItems, readItem };

/**
 * User type (replaces DrupalUser)
 */
export interface DirectusUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  status: string;
}

/**
 * Auth tokens from Directus
 */
export interface AuthTokens {
  access_token: string;
  expires: number;
  refresh_token: string;
}
