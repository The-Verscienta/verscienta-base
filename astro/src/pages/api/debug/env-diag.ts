/**
 * GET /api/_debug/env-diag
 *
 * Diagnostic endpoint — reports WHICH env-access path can see XAI_API_KEY
 * without ever returning the value. Safe to ship; returns booleans + key
 * names only. Remove once the env wiring is verified.
 */
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  const l = locals as Record<string, unknown>;
  const runtime = (l?.runtime as Record<string, unknown> | undefined) ?? undefined;
  const runtimeEnv = (runtime?.env as Record<string, unknown> | undefined) ?? undefined;
  const localsEnv = (l?.env as Record<string, unknown> | undefined) ?? undefined;

  const localsKeys = Object.keys(l ?? {});
  const runtimeKeys = runtime ? Object.keys(runtime) : null;
  const runtimeEnvKeys = runtimeEnv ? Object.keys(runtimeEnv) : null;
  const localsEnvKeys = localsEnv ? Object.keys(localsEnv) : null;

  const has = (obj: Record<string, unknown> | undefined, key: string) =>
    Boolean(obj && typeof obj[key] === "string" && (obj[key] as string).length > 0);

  return new Response(
    JSON.stringify(
      {
        // Where is the env actually exposed?
        "locals.keys": localsKeys,
        "locals.runtime exists": Boolean(runtime),
        "locals.runtime keys": runtimeKeys,
        "locals.runtime.env exists": Boolean(runtimeEnv),
        "locals.runtime.env keys": runtimeEnvKeys,
        "locals.env exists": Boolean(localsEnv),
        "locals.env keys": localsEnvKeys,

        // Can we find XAI_API_KEY through each path?
        "locals.runtime.env.XAI_API_KEY present": has(runtimeEnv, "XAI_API_KEY"),
        "locals.env.XAI_API_KEY present": has(localsEnv, "XAI_API_KEY"),
        "import.meta.env.XAI_API_KEY present": has(
          import.meta.env as unknown as Record<string, unknown>,
          "XAI_API_KEY"
        ),
      },
      null,
      2
    ),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
