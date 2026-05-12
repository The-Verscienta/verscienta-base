/**
 * Server-side auth helpers for Astro endpoints.
 *
 * Pattern: read the access_token cookie (or a fresher one stashed on
 * Astro.locals by middleware) and fetch the current user from Directus.
 * Role *names* are checked (not IDs) because IDs differ across
 * environments — the names "Administrator", "Professional Access", and
 * "Patient Access" are stable.
 *
 * Token refresh is handled transparently by middleware.ts — when the
 * access_token is missing or expired, middleware calls /auth/refresh and
 * places the new token on `locals.accessToken`. Endpoints just pass
 * `locals` to `getAuthedUser` and stay oblivious.
 */

import { getDirectusAdminToken } from "./env";

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";

export interface AuthedUser {
  id: string;
  email?: string;
  email_verified?: boolean;
  first_name?: string;
  last_name?: string;
  avatar?: string | null;
  role?: {
    id: string;
    name?: string;
    /** Directus 11: policies attached to the role. */
    policies?: Array<{ policy?: { admin_access?: boolean } | null }>;
  };
  /** Policies attached directly to the user (in addition to role policies). */
  policies?: Array<{ policy?: { admin_access?: boolean } | null }>;
}

/** Locals slot the middleware uses to publish a freshly-refreshed token. */
interface AuthLocals {
  accessToken?: string;
}

/** Read the access_token cookie from a request. */
export function getAccessToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const m = cookieHeader.match(/(?:^|;\s*)access_token=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Get the freshest access_token for this request — prefers a token the
 * middleware just refreshed (on locals) over the (potentially stale)
 * cookie. Use this in endpoints that call Directus directly.
 */
export function getRequestAccessToken(request: Request, locals?: unknown): string | null {
  const stashed = (locals as AuthLocals | undefined)?.accessToken;
  return stashed || getAccessToken(request);
}

/**
 * Verify the bearer token by asking Directus who it belongs to. Returns just
 * the user id (or null if the token is missing/invalid). Most user records
 * are unreadable to the user themselves (default Directus permissions), so we
 * only rely on this call for identity — privileged fields are fetched below
 * via the static admin token.
 */
async function verifyTokenIdentity(token: string): Promise<string | null> {
  try {
    const res = await fetch(`${DIRECTUS_URL}/users/me?fields=id`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const id = (data?.data?.id as string | undefined) ?? null;
    return id;
  } catch {
    return null;
  }
}

/**
 * Fetch the authenticated user from Directus, or null if no/invalid token.
 *
 * Two-step lookup:
 *  1. Verify the user's session token (returns their id).
 *  2. Use the server's admin static token to fetch role/policies — most
 *     deployments restrict directus_users self-read, so the session token
 *     alone can't see these fields.
 *
 * @param request - the incoming Request
 * @param locals  - Astro.locals (middleware may have stashed a refreshed
 *                  access_token here; we prefer that over the cookie)
 */
export async function getAuthedUser(
  request: Request,
  locals?: unknown
): Promise<AuthedUser | null> {
  const stashed = (locals as AuthLocals | undefined)?.accessToken;
  const token = stashed || getAccessToken(request);
  if (!token) return null;

  const userId = await verifyTokenIdentity(token);
  if (!userId) return null;

  const adminToken = getDirectusAdminToken(locals);
  if (!adminToken) {
    console.error("DIRECTUS_TOKEN not configured — cannot look up user role/policies");
    return null;
  }

  try {
    // Don't URL-encode the fields list — Directus 11 expects bare commas in
    // the `fields` query param and 403s on `%2C`-escaped variants. The values
    // are URL-safe already (alphanumeric + dot + comma). userId is a UUID.
    const fields = [
      "id",
      "first_name",
      "last_name",
      "email",
      "email_verified",
      "avatar",
      "role.id",
      "role.name",
      "role.policies.policy.admin_access",
      "policies.policy.admin_access",
    ].join(",");
    const url = `${DIRECTUS_URL}/users/${userId}?fields=${fields}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("getAuthedUser admin lookup non-ok:", res.status, body.slice(0, 200));
      return null;
    }
    const data = await res.json();
    return (data?.data as AuthedUser) || null;
  } catch (err) {
    console.error("getAuthedUser admin lookup failed:", err);
    return null;
  }
}

/** Role names treated as "professional or higher". */
export const PROFESSIONAL_ROLES = new Set(["Administrator", "Professional Access"]);
export const PATIENT_ROLES = new Set(["Patient Access"]);
export const AUTHENTICATED_ROLES = new Set([
  ...PROFESSIONAL_ROLES,
  ...PATIENT_ROLES,
]);

export type AuthGate = "professional" | "authenticated";

/**
 * True if any policy attached to the user (directly or via role) grants
 * admin_access. In Directus 11 this is the authoritative way to identify
 * an admin — role names can be customized but admin_access is canonical.
 */
export function userIsAdmin(user: AuthedUser | null): boolean {
  if (!user) return false;
  const fromRole = user.role?.policies?.some((p) => p?.policy?.admin_access === true) ?? false;
  const direct = user.policies?.some((p) => p?.policy?.admin_access === true) ?? false;
  return fromRole || direct;
}

export function userHasAccess(user: AuthedUser | null, gate: AuthGate): boolean {
  if (!user) return false;
  if (userIsAdmin(user)) return true;
  const roleName = user.role?.name;
  if (!roleName) return false;
  if (gate === "professional") return PROFESSIONAL_ROLES.has(roleName);
  if (gate === "authenticated") {
    return PROFESSIONAL_ROLES.has(roleName) || PATIENT_ROLES.has(roleName);
  }
  return false;
}

/**
 * Standard 401/403 JSON for gated endpoints.
 */
export function gatedResponse(reason: "auth" | "upgrade", extraHeaders: Record<string, string> = {}): Response {
  if (reason === "auth") {
    return new Response(
      JSON.stringify({ error: "Sign in required.", isAuthError: true }),
      { status: 401, headers: { "Content-Type": "application/json", ...extraHeaders } }
    );
  }
  return new Response(
    JSON.stringify({
      error: "This tool is for verified practitioners.",
      isUpgradeRequired: true,
    }),
    { status: 403, headers: { "Content-Type": "application/json", ...extraHeaders } }
  );
}
