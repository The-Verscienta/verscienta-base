/**
 * Server-side environment access.
 *
 * On Cloudflare Workers, secrets live on the runtime `env` binding —
 * `import.meta.env` is build-time only and resolves to `undefined` for
 * non-PUBLIC vars. On Node (local dev), `import.meta.env` is populated
 * from `.env` files via Vite. We try runtime first, fall back to
 * build-time so both environments work.
 *
 * Read env per request — never hoist these reads to module scope, or
 * Cloudflare deploys will permanently capture `undefined`.
 */

export interface AiEnv {
  XAI_API_KEY?: string;
  XAI_API_URL?: string;
  XAI_MODEL?: string;
}

interface CloudflareLocals {
  runtime?: {
    env?: Record<string, string | undefined>;
  };
}

export function getAiEnv(locals: unknown): AiEnv {
  const runtimeEnv = (locals as CloudflareLocals | undefined)?.runtime?.env;
  return {
    XAI_API_KEY: runtimeEnv?.XAI_API_KEY ?? import.meta.env.XAI_API_KEY,
    XAI_API_URL: runtimeEnv?.XAI_API_URL ?? import.meta.env.XAI_API_URL,
    XAI_MODEL: runtimeEnv?.XAI_MODEL ?? import.meta.env.XAI_MODEL,
  };
}

export function hasAiKey(env: AiEnv): boolean {
  return Boolean(env.XAI_API_KEY);
}
