/**
 * Server-side auth helpers for Astro endpoints.
 *
 * Pattern: read the access_token cookie, fetch the current user from Directus,
 * and gate by role name. Role *names* are checked (not IDs) because IDs differ
 * across environments — the names "Administrator", "Professional Access", and
 * "Patient Access" are stable.
 */

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";

export interface AuthedUser {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: { id: string; name?: string };
}

/** Read the access_token cookie from a request. */
export function getAccessToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const m = cookieHeader.match(/access_token=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Fetch the authenticated user from Directus, or null if no/invalid token.
 */
export async function getAuthedUser(request: Request): Promise<AuthedUser | null> {
  const token = getAccessToken(request);
  if (!token) return null;
  try {
    const res = await fetch(`${DIRECTUS_URL}/users/me?fields=id,first_name,last_name,email,role.id,role.name`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.data as AuthedUser) || null;
  } catch {
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

export function userHasAccess(user: AuthedUser | null, gate: AuthGate): boolean {
  if (!user?.role?.name) return false;
  if (gate === "professional") return PROFESSIONAL_ROLES.has(user.role.name);
  if (gate === "authenticated") {
    return PROFESSIONAL_ROLES.has(user.role.name) || PATIENT_ROLES.has(user.role.name);
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
