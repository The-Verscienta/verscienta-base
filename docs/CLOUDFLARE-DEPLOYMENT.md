# Cloudflare Deployment — Environment Variables

The Astro frontend is built with `npm run build:cloudflare` (uses `@astrojs/cloudflare`) and deployed to Cloudflare Pages/Workers. This is the canonical list of env vars the frontend reads.

## Setting variables

In the Cloudflare dashboard: **Workers & Pages → your project → Settings → Variables and Secrets**.

- **Plain text** for non-sensitive values (`PUBLIC_*` ones are fine here — they end up in the client bundle anyway).
- **Encrypted secret** for everything else. Once encrypted, the value can be replaced but never read back.

If you have separate Production and Preview environments, set them in both. Don't set master/admin secrets in Preview if previews are publicly reachable.

## Required for production

### Public (exposed to the browser)

`PUBLIC_*` vars are inlined into the client bundle at build time. Treat them as public.

| Variable | Value | Purpose |
|---|---|---|
| `PUBLIC_DIRECTUS_URL` | `https://backend.verscienta.com` | Directus REST API origin used by the SDK and client-side fetches |
| `PUBLIC_MEILI_URL` | `https://search.verscienta.com` | Meilisearch endpoint for client-side instant search |
| `PUBLIC_MEILI_SEARCH_KEY` | search-only key from `setup-meilisearch.mjs` | Restricted to `search` action on `verscienta_*` indices — safe in the bundle |
| `PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key | Rendered in the registration form widget |
| `PUBLIC_SITE_URL` | `https://verscienta.com` | Used in `<link rel=canonical>` and other absolute-URL builders |

### Server-only secrets (encrypted)

These are read only inside Astro endpoints / SSR — never in client code. Set as **Secret** in Cloudflare so they can't leak via dashboard reads.

| Variable | Purpose | Sources |
|---|---|---|
| `DIRECTUS_TOKEN` | Admin static token for server-side Directus calls (auth flows, server-rendered pages) | [`src/lib/directus.ts`](../astro/src/lib/directus.ts), several `pages/api/auth/*.ts` |
| `XAI_API_KEY` | Grok API auth — symptom analysis, formula explanations, herb-drug check | [`src/lib/grok.ts`](../astro/src/lib/grok.ts), `pages/api/grok/*.ts` |
| `XAI_API_URL` | Optional override; defaults to `https://api.x.ai/v1` | [`src/lib/grok.ts`](../astro/src/lib/grok.ts) |
| `XAI_MODEL` | Optional override; defaults to `grok-4.3` | [`src/lib/grok.ts`](../astro/src/lib/grok.ts) |
| `GEOAPIFY_API_KEY` | Practitioner / clinic finder geocoding + autocomplete | `pages/api/geocode.ts`, `pages/api/geocode-autocomplete.ts` |
| `TURNSTILE_SECRET_KEY` | Server-side validation of Turnstile tokens during registration | [`src/lib/turnstile.ts`](../astro/src/lib/turnstile.ts) |
| `SYMPY_SERVICE_URL` | URL of the SymPy compute service (default `http://localhost:8001`) | `pages/api/symbolic-compute.ts` |
| `SYMPY_API_KEY` | Auth header sent to the SymPy service | `pages/api/symbolic-compute.ts` |
| `CSRF_SECRET` | HMAC key for CSRF token signing — generate with `openssl rand -hex 32` | [`src/lib/csrf.ts`](../astro/src/lib/csrf.ts) |

### Do NOT set on Cloudflare

| Variable | Why not |
|---|---|
| `MEILI_MASTER_KEY` | Master key has admin rights on Meilisearch. The frontend only needs `PUBLIC_MEILI_SEARCH_KEY` (search-only). The master key stays on the backend (Coolify env). |
| `NODE_ENV` | Cloudflare Workers/Pages set this automatically based on environment. |

## Cloudflare runtime quirks

- The geocoding endpoints check `locals.runtime.env` first (Cloudflare Workers binding) before falling back to `import.meta.env`, so `GEOAPIFY_API_KEY` works whether set as a Variable or a Secret. See [pages/api/geocode.ts](../astro/src/pages/api/geocode.ts).
- `process.env.*` is generally NOT available at runtime on Cloudflare — code falls back to it last. Don't rely on it.
- `import.meta.env.PROD` / `import.meta.env.DEV` are evaluated at build time by Vite and are reliable.

## Rotating secrets

When a secret leaks (or you re-generate one — like running `setup-meilisearch.mjs` against a new Meilisearch instance):

1. Generate the new value.
2. Update the Cloudflare Secret.
3. Trigger a redeploy (Cloudflare → Pages → Deployments → "Retry deployment" on the latest, or push a new commit). Workers/Pages don't pick up secret changes without a redeploy.
4. Revoke the old key on the upstream service (Meilisearch admin, Directus admin, etc.).

## Backend secrets are separate

The Directus side (Coolify-hosted, image `ghcr.io/<owner>/verscienta-directus:latest`) has its own env: `SECRET`, `DB_PASSWORD`, `MEILI_MASTER_KEY`, `TREFLE_API_KEY`, `PERENUAL_API_KEY`, `CLOUDFLARE_IMAGES_TOKEN`, etc. — see [docker-compose.new.yml](../docker-compose.new.yml). Don't mix them with the Cloudflare frontend env.
