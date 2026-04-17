# Verscienta Health — Astro Frontend

Astro 6 frontend for Verscienta Health, deployed to Cloudflare Pages.

## Quick Start

```bash
npm install
npm run tokens:build   # Generate CSS from design tokens
npm run dev            # http://localhost:4321
```

## Architecture

- **Framework:** Astro 6 with SSR (Cloudflare adapter)
- **Islands:** React 19 for interactive components (`client:load`)
- **Styling:** Tailwind CSS 4 + Style Dictionary design tokens
- **Data:** Directus SDK for content, MeiliSearch for search
- **AI:** xAI Grok for symptom analysis and herb-drug checks
- **Auth:** Directus built-in auth with HTTP-only cookies

## Project Structure

```
src/
├── pages/              # Astro pages (SSR) + API routes
│   ├── api/            # 15 server endpoints (auth, AI, content, search)
│   ├── herbs/          # Listing + [id] detail
│   ├── formulas/       # Listing + [id] detail
│   └── ...
├── components/         # React islands for interactive features
│   ├── SymptomChecker  # AI symptom analysis (client:load)
│   ├── search/SearchUI # MeiliSearch + InstantSearch (client:load)
│   ├── auth/LoginForm  # Zod-validated login (client:load)
│   ├── herb/DoseCalc   # SymPy dosage calculator (client:load)
│   └── ui/DarkMode     # Theme toggle (client:load)
├── layouts/            # RootLayout (HTML shell) + ContentLayout (header/footer)
├── lib/                # Shared libraries (directus, auth, csrf, grok, search, etc.)
├── hooks/              # React hooks (useAuth, useFavorites)
├── styles/             # Generated CSS from design tokens
└── design-tokens/      # Color primitives + semantic theme tokens
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 4321) |
| `npm run build` | Build for production (tokens + Astro) |
| `npm run preview` | Preview production build |
| `npm run check` | Astro type checking |
| `npm run tokens:build` | Generate CSS from design tokens |
| `npm test` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |

## Environment Variables

Copy `.env.example` to `.env` and fill in values. Public vars (prefixed `PUBLIC_`) are available in client code.

## Deployment

Deployed to Cloudflare Pages via GitHub Actions (`.github/workflows/deploy-astro.yml`).
