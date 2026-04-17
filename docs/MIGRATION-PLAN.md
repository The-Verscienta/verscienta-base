# Migration Plan: Drupal 11 + Next.js → Directus + Astro 6

## Context

Verscienta.com is a herb database with TCM properties, research data, and an AI symptom checker. The current stack (Drupal 11 + Next.js 15) is being migrated to Directus + Astro 6 for faster page loads, lower costs, and a cleaner data model. There is **no existing content or users** — this is a clean-slate migration of the application layer only.

### Key Decisions
- **Islands framework:** Keep React (existing components as Astro islands)
- **Deployment:** Cloudflare Pages for Astro frontend, Coolify for Directus + MariaDB + Redis + SymPy
- **Search:** Replace Algolia with self-hosted MeiliSearch on Coolify
- **Auth:** Directus built-in auth (no OIDC provider needed — no existing users)
- **Schema strategy:** Approach A (clean Directus DB) with hybrid paragraph modeling (flatten + JSON repeater + O2M)

### Architecture Overview
```
[Cloudflare Pages]          [Coolify (self-hosted)]
  Astro 6 (SSR edge)   →     Directus (api.verscienta.com)
  React islands                 ├── MariaDB 11
  Static assets via CDN         ├── Redis 7
                                ├── MeiliSearch
                                ├── DragonflyDB
                                └── SymPy compute
```

---

## Phase 1: Directus Backend Setup (Days 1-3)

### 1.1 Create new project structure
- [ ] Create `directus/` directory at repo root (alongside existing `backend/`)
- [ ] Initialize with `npx create-directus-project directus`
- [ ] Create `directus/Dockerfile`:
  ```dockerfile
  FROM directus/directus:11
  # Copy custom extensions, migrations, snapshots
  COPY ./snapshots /directus/snapshots
  COPY ./extensions /directus/extensions
  ```
- [ ] Create `directus/docker-compose.yml` for local dev (Directus + MariaDB + Redis)

**Files to create:**
- `directus/Dockerfile`
- `directus/docker-compose.yml`
- `directus/.env.example`
- `directus/snapshots/` (empty, will hold schema snapshots)
- `directus/extensions/` (empty, for future custom extensions)

### 1.2 Build Directus schema (from DIRECTUS-SCHEMA-DESIGN.md)
- [ ] Create 9 primary collections: `herbs`, `formulas`, `conditions`, `modalities`, `practitioners`, `tcm_ingredients`, `tcm_target_interactions`, `tcm_clinical_evidence`, `import_logs`
- [ ] Create 12 O2M child collections: `herb_clinical_studies`, `herb_drug_interactions`, `herb_dosages`, `herb_constituents`, `herb_preparations`, `herb_historical_texts`, `herb_practitioner_notes`, `herb_case_studies`, `herb_references`, `herb_images`, `formula_ingredients`, `formula_modifications`
- [ ] Create 2 taxonomy collections: `herb_tags`, `tcm_categories` (with `parent_id` self-ref for hierarchy)
- [ ] Create 13 M2M junction tables (herbs↔conditions, herbs↔herbs self-refs, etc.)
- [ ] Add ~17 flattened fields to `herbs` (toxicity_, storage_, sourcing_ prefixes)
- [ ] Add 7 JSON repeater fields to `herbs` (common_names, external_ids, contributors, safety_warnings, adulteration_risks, quality_standards, regulatory_status)
- [ ] Install Inline Repeater Interface extension: `npm install @directus-labs/inline-repeater-interface`
- [ ] Configure field grouping in admin UI (13 collapsible sections)
- [ ] Export schema snapshot: `npx directus schema snapshot ./snapshots/initial.yaml`
- [ ] Commit snapshot to Git

**Reference:** `docs/DIRECTUS-SCHEMA-DESIGN.md` (complete field specs)

### 1.3 Configure Directus
- [ ] Enable Redis caching in `.env` (`CACHE_ENABLED=true`, `CACHE_STORE=redis`)
- [ ] Configure CORS for `verscienta.com` and `localhost:4321` (Astro dev)
- [ ] Set up admin role and API token for frontend
- [ ] Configure file storage (Cloudflare R2 or local with CDN)

### 1.4 Seed taxonomy data
- [ ] Populate `herb_tags` with hierarchical terms (By Action, By Condition, By Tradition, By Part, By Form) from `setup-drupal.sh`
- [ ] Populate `tcm_categories` with 16 top-level TCM categories from `setup-tcm-content-types.sh`
- [ ] Write seed script using `@directus/sdk`

**Files to create:**
- `directus/scripts/seed-taxonomies.mjs`

---

## Phase 2: MeiliSearch Setup (Days 3-4)

### 2.1 Add MeiliSearch service
- [ ] Add MeiliSearch container to `directus/docker-compose.yml`
  ```yaml
  meilisearch:
    image: getmeili/meilisearch:v1.12
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
    volumes:
      - meili_data:/meili_data
    ports:
      - "7700:7700"
  ```
- [ ] Create search index configuration matching current Algolia config (from `docs/DRUPAL-COMPREHENSIVE-HERB-SETUP.md` lines 786-818)
- [ ] Configure searchable attributes, filterable attributes, sortable attributes
- [ ] Create Directus Flow to sync collection changes to MeiliSearch on item create/update/delete

### 2.2 Create indexing script
- [ ] Write MeiliSearch index setup script
- [ ] Define 6 indices: `herbs`, `modalities`, `conditions`, `practitioners`, `formulas`, `all` (combined)
- [ ] Configure facets: plant_type, parts_used, tcm_temperature, tcm_taste, tcm_meridians, western_properties, conservation_status, peer_review_status

**Files to create:**
- `directus/scripts/setup-meilisearch.mjs`
- `directus/extensions/hooks/meilisearch-sync/` (Directus hook extension for auto-sync)

---

## Phase 3: Astro Frontend Setup (Days 4-7)

### 3.1 Initialize Astro project
- [ ] Create new Astro 6 project in `astro/` directory at repo root
  ```bash
  npm create astro@latest astro -- --template minimal
  ```
- [ ] Install dependencies:
  ```bash
  npm install @directus/sdk react react-dom @astrojs/react @astrojs/cloudflare
  npm install -D tailwindcss @tailwindcss/vite typescript
  ```
- [ ] Configure `astro.config.mjs`:
  - `output: 'server'` (SSR for Cloudflare)
  - `adapter: cloudflare()`
  - `integrations: [react(), tailwind()]`

### 3.2 Port shared libraries (from `frontend/lib/`)
These are framework-agnostic and transfer with minimal changes:

- [ ] `astro/src/lib/directus.ts` — Directus SDK client (replaces `frontend/lib/drupal.ts`)
  - Initialize `createDirectus(PUBLIC_DIRECTUS_URL).with(rest())`
  - Export typed client
- [ ] `astro/src/lib/csrf.ts` — Copy from `frontend/lib/csrf.ts`, change `process.env` → `import.meta.env`
- [ ] `astro/src/lib/rate-limit.ts` — Copy from `frontend/lib/rate-limit.ts`, adapt for Cloudflare Workers (use KV or in-memory Map)
- [ ] `astro/src/lib/auth.ts` — Rewrite to use Directus auth endpoints instead of Drupal OAuth
  - `login(email, password)` → `POST /auth/login` (Directus built-in)
  - `refresh(token)` → `POST /auth/refresh`
  - `me(token)` → `GET /users/me`
- [ ] `astro/src/lib/grok.ts` — Copy from `frontend/lib/grok.ts` (xAI calls are backend-agnostic)
- [ ] `astro/src/lib/api-client.ts` — Copy CSRF-aware fetch wrapper, minimal changes

**Source files to port:**
- `frontend/lib/drupal.ts` → rewrite as `directus.ts`
- `frontend/lib/csrf.ts` → copy + env var syntax
- `frontend/lib/rate-limit.ts` → copy + adapt store
- `frontend/lib/auth.ts` → rewrite for Directus auth
- `frontend/lib/grok.ts` → copy as-is
- `frontend/lib/api-client.ts` → copy + minor adapt
- `frontend/lib/validation.ts` → copy as-is (Zod schemas)

### 3.3 Port design system
- [ ] Copy `frontend/design-tokens/` → `astro/src/design-tokens/`
- [ ] Copy Style Dictionary config → `astro/style-dictionary.config.mjs`
- [ ] Set up Tailwind v4 with CSS variables from tokens
- [ ] Port global styles and font loading (Crimson Pro, Source Sans 3, JetBrains Mono, Noto Serif SC)
- [ ] Astro 6 Fonts API for font optimization

### 3.4 Create layouts
- [ ] `astro/src/layouts/RootLayout.astro` — HTML shell, meta, fonts, theme toggle script
- [ ] `astro/src/layouts/ContentLayout.astro` — Header + Footer + main content area
- [ ] Port `frontend/components/layout/Header.tsx` as React island (`client:load`)
- [ ] Port `frontend/components/layout/Footer.tsx` as Astro component (static)
- [ ] Port `frontend/components/layout/Navigation.tsx` as React island (`client:load`)

### 3.5 Implement Astro middleware
- [ ] Create `astro/src/middleware.ts`:
  - Security headers (CSP, HSTS, X-Frame-Options, etc.)
  - CSRF token generation and cookie setting
  - Request ID generation
  - Port logic from `frontend/middleware.ts`

---

## Phase 4: Port API Routes (Days 7-11)

Port all 23 Next.js API routes to Astro server endpoints. Pattern for each:
```
frontend/app/api/{path}/route.ts  →  astro/src/pages/api/{path}.ts
```

### 4.1 Auth routes (6 endpoints)
- [ ] `src/pages/api/auth/login.ts` — Directus `/auth/login`, set HTTP-only cookies
- [ ] `src/pages/api/auth/logout.ts` — Directus `/auth/logout`, clear cookies
- [ ] `src/pages/api/auth/me.ts` — Directus `/users/me` with bearer token from cookie
- [ ] `src/pages/api/auth/register.ts` — Directus `/users` (POST) + Turnstile verification
- [ ] `src/pages/api/auth/profile.ts` — Directus `/users/me` (PATCH)
- [ ] `src/pages/api/auth/verify-email.ts` — Directus email verification flow

**Source:** `frontend/app/api/auth/*/route.ts`

### 4.2 AI/Grok routes (4 endpoints)
- [ ] `src/pages/api/grok/symptom-analysis.ts` — Copy logic, update pattern/formula lookups to use Directus
- [ ] `src/pages/api/grok/follow-ups.ts` — Copy as-is (calls xAI only)
- [ ] `src/pages/api/grok/herb-drug-check.ts` — Update herb lookup to Directus
- [ ] `src/pages/api/grok/explain-formula.ts` — Update formula lookup to Directus

**Source:** `frontend/app/api/grok/*/route.ts`, `frontend/lib/grok.ts`

### 4.3 Content routes (11 endpoints)
These currently proxy to Drupal JSON:API. Most become thin wrappers around Directus SDK calls or can be eliminated entirely (Astro pages can fetch directly).

- [ ] `src/pages/api/formulas/index.ts` — `readItems('formulas', {...})`
- [ ] `src/pages/api/formulas/[id]/similar.ts` — Directus filter query
- [ ] `src/pages/api/formulas/[id]/network.ts` — Graph query via Directus relations
- [ ] `src/pages/api/formulas/[id]/contributions.ts`
- [ ] `src/pages/api/formulas/[id]/family.ts`
- [ ] `src/pages/api/concepts/index.ts` + `[id].ts`
- [ ] `src/pages/api/patterns/index.ts` + `[id].ts`
- [ ] `src/pages/api/points/index.ts` + `[id].ts`
- [ ] `src/pages/api/herbs/[id]/targets.ts` — Query `tcm_target_interactions` with herb filter

**Source:** `frontend/app/api/*/route.ts`

### 4.4 Other routes (2 endpoints)
- [ ] `src/pages/api/symbolic-compute.ts` — Proxy to SymPy service (unchanged logic)
- [ ] `src/pages/api/search.ts` — Rewrite to query MeiliSearch instead of Algolia

**Source:** `frontend/app/api/symbolic-compute/route.ts`

---

## Phase 5: Port Pages (Days 11-16)

### 5.1 Static pages (direct Astro conversion)
These are simple content pages with no data fetching:
- [ ] `src/pages/about.astro`
- [ ] `src/pages/contact.astro`
- [ ] `src/pages/faq.astro`
- [ ] `src/pages/privacy.astro`
- [ ] `src/pages/terms.astro`

**Source:** `frontend/app/{about,contact,faq,privacy,terms}/page.tsx`

### 5.2 Content listing pages
Server-rendered pages that fetch from Directus:
- [ ] `src/pages/herbs/index.astro` — `readItems('herbs', { fields, filter, limit })`
- [ ] `src/pages/formulas/index.astro`
- [ ] `src/pages/conditions/index.astro`
- [ ] `src/pages/modalities/index.astro`
- [ ] `src/pages/practitioners/index.astro`
- [ ] `src/pages/clinics/index.astro`
- [ ] `src/pages/patterns/index.astro`
- [ ] `src/pages/points/index.astro`
- [ ] `src/pages/concepts/index.astro`

### 5.3 Content detail pages
Dynamic routes with deep relational data fetching:
- [ ] `src/pages/herbs/[id].astro` — Fetch herb with all O2M children, M2M relations, JSON fields
- [ ] `src/pages/formulas/[id].astro` — Fetch formula with ingredients, modifications, conditions
- [ ] `src/pages/conditions/[id].astro`
- [ ] `src/pages/modalities/[id].astro`
- [ ] `src/pages/practitioners/[id].astro`
- [ ] `src/pages/clinics/[id].astro`
- [ ] `src/pages/patterns/[id].astro`
- [ ] `src/pages/points/[id].astro`
- [ ] `src/pages/concepts/[id].astro`

**Source:** `frontend/app/*/[id]/page.tsx` — Convert from Next.js server components to Astro pages. Data fetching moves from `drupal.getResource()` to `directus.request(readItem('herbs', id, { fields: [...] }))`

### 5.4 Interactive pages (React islands)
- [ ] `src/pages/symptom-checker.astro` — Shell page with `<SymptomChecker client:load />` React island
- [ ] `src/pages/tools/herb-drug-interactions.astro` — React island
- [ ] `src/pages/search.astro` — MeiliSearch-powered search UI (React island or Astro + client JS)
- [ ] `src/pages/admin/index.astro` — Admin dashboard
- [ ] `src/pages/admin/knowledge-graph.astro` — `<KnowledgeGraph client:load />` React island

**Source:** `frontend/app/symptom-checker/page.tsx`, `frontend/app/search/page.tsx`

### 5.5 Auth pages
- [ ] `src/pages/login.astro`
- [ ] `src/pages/register.astro`
- [ ] `src/pages/forgot-password.astro`
- [ ] `src/pages/reset-password.astro`
- [ ] `src/pages/verify-email.astro`
- [ ] `src/pages/profile.astro`
- [ ] `src/pages/favorites.astro`

---

## Phase 6: Port React Components (Days 11-16, parallel with Phase 5)

### 6.1 Static components → Astro components
Convert presentational React components to `.astro` files (smaller bundle, no JS shipped):
- [ ] Card components: HerbCard, FormulaCard, ConditionCard, ModalityCard, ConceptCard, PatternCard, PointCard
- [ ] UI primitives: Badge, Breadcrumbs, Skeleton, Pagination
- [ ] Content sections: HerbDetailSection, FormulaDetailSection, etc.

**Source:** `frontend/components/ui/`, `frontend/components/herb/`, `frontend/components/formula/`

### 6.2 Interactive components → React islands
Keep as React, import with `client:load` or `client:visible`:
- [ ] `SymptomChecker` (`client:load`) — core feature
- [ ] `DoseCalculator` (`client:load`) — SymPy integration
- [ ] `MolecularTargets` (`client:visible`) — data viz, lazy load
- [ ] `ClinicMap` / `ClinicMapInner` (`client:visible`) — Leaflet map
- [ ] `KnowledgeGraph` (`client:load`) — Force graph
- [ ] `FormulaNetwork`, `SimilarFormulas`, `FormulaFamily` (`client:visible`)
- [ ] `TongueAndPulsePanel` (`client:load`)
- [ ] `SearchBar` / `HeroSearch` (`client:load`) — rewrite to use MeiliSearch JS client
- [ ] `Header` / `Navigation` (`client:load`) — mobile menu, scroll detection
- [ ] `DarkModeToggle` (`client:load`)
- [ ] `UserMenu` / `TurnstileWidget` (`client:load`)
- [ ] `Modal`, `Toast`, `FilterPanel` (`client:load`)

### 6.3 Search component rewrite
- [ ] Replace `react-instantsearch` (Algolia) with `meilisearch-react` or custom MeiliSearch integration
- [ ] Update SearchBar to query MeiliSearch HTTP API
- [ ] Port faceted search UI from Algolia widgets to custom components

---

## Phase 7: Data Sync Services (Days 16-19)

### 7.1 Trefle Sync (standalone Node.js)
- [ ] Create `services/trefle-sync/` directory
- [ ] Port logic from `backend/web/modules/custom/trefle_sync/`:
  - Paginated API fetching with token bucket rate limiting
  - Field mapping (Trefle fields → Directus herbs collection)
  - Image downloading and upload to Directus Files API
  - Cron-driven sync tracking
- [ ] Use `@directus/sdk` to create/update items
- [ ] Add to Coolify as a scheduled service (cron container)

**Source:** `backend/web/modules/custom/trefle_sync/src/`

### 7.2 Perenual Sync (standalone Node.js)
- [ ] Create `services/perenual-sync/` directory
- [ ] Port logic from `backend/web/modules/custom/perenual_sync/`:
  - Search, import, and enrich workflows
  - Rate limiting via state tracking
  - Field mapping to Directus
- [ ] Secondary data source, lower priority than Trefle

**Source:** `backend/web/modules/custom/perenual_sync/src/`

### 7.3 Geocoding (Directus Flow)
- [ ] Create Directus Flow: on practitioner/clinic create/update → call Nominatim API → update lat/lon fields
- [ ] Replaces `holistic_hub` module entirely (no custom code needed)

---

## Phase 8: Infrastructure & CI/CD (Days 19-22)

### 8.1 Cloudflare Pages deployment
- [ ] Create `wrangler.toml` in `astro/` for Cloudflare Pages config
- [ ] Set up Cloudflare Pages project linked to repo
- [ ] Configure environment variables in Cloudflare dashboard
- [ ] Set up custom domain: `verscienta.com` → Cloudflare Pages
- [ ] Configure Cloudflare KV for rate limiting (replace in-memory store)

### 8.2 Update Coolify deployment
- [ ] Add Directus service to Coolify (replaces Drupal)
- [ ] Add MeiliSearch service to Coolify
- [ ] Keep existing: MariaDB, Redis, DragonflyDB, SymPy
- [ ] Update `api.verscienta.com` to point to Directus
- [ ] Remove Drupal service after verification

### 8.3 Update nginx config
- [ ] Update `nginx/conf.d/verscienta.conf`:
  - Remove Drupal upstream, add Directus upstream (port 8055)
  - Remove Drupal file security blocks (.engine, .inc, etc.)
  - Add Directus asset caching rules (`/assets/`)
  - Remove frontend upstream (Cloudflare handles it now)
  - Keep api.verscienta.com block pointing to Directus

### 8.4 CI/CD pipelines
- [ ] Create `.github/workflows/deploy-directus.yml`:
  - Build Directus Docker image
  - Push to GHCR
  - Trigger Coolify webhook
- [ ] Create `.github/workflows/deploy-astro.yml`:
  - Lint + typecheck + test
  - Deploy to Cloudflare Pages via `wrangler pages deploy`
- [ ] Update `.github/workflows/test.yml` for Astro (Vitest + Playwright)
- [ ] Keep SymPy build/deploy workflow unchanged

**Files to create/update:**
- `.github/workflows/deploy-directus.yml` (new)
- `.github/workflows/deploy-astro.yml` (new, replaces deploy-frontend.yml)
- `.github/workflows/test.yml` (update)
- `nginx/conf.d/verscienta.conf` (update)

### 8.5 Backup updates
- [ ] Update `scripts/backup.sh`:
  - Change container names (drupal → directus)
  - Change file paths (`/var/www/html/web/sites/default/files` → `/directus/uploads`)
  - Add MeiliSearch data backup

---

## Phase 9: Testing & Cutover (Days 22-25)

### 9.1 Unit tests
- [ ] Port Jest tests to Vitest (Astro-native test runner)
- [ ] Update API route tests to use Directus response format
- [ ] Keep component tests for React islands
- [ ] Port validation tests as-is (Zod schemas unchanged)

**Source:** `frontend/__tests__/` — 50+ test files

### 9.2 E2E tests
- [ ] Update Playwright config for Astro dev server
- [ ] Port existing E2E tests (framework-agnostic, test URLs/flows):
  - `auth.spec.ts` — login/register forms
  - `homepage.spec.ts` — home page rendering
  - `search.spec.ts` — search functionality (update for MeiliSearch)
  - `symptom-checker.spec.ts` — symptom input + analysis
  - `detail-pages.spec.ts` — herb/formula detail pages

**Source:** `frontend/e2e/`

### 9.3 Integration testing
- [ ] Test all 23 API routes against Directus
- [ ] Test Grok AI symptom analysis end-to-end
- [ ] Test MeiliSearch indexing and querying
- [ ] Test SymPy dosage calculator integration
- [ ] Test Turnstile CAPTCHA on registration
- [ ] Test Cloudflare Images upload and delivery (if using)
- [ ] Test auth flow: register → login → profile → logout

### 9.4 Cutover
- [ ] Deploy Directus to production Coolify
- [ ] Deploy Astro to Cloudflare Pages
- [ ] Update DNS: `verscienta.com` → Cloudflare Pages, `api.verscienta.com` → Coolify Directus
- [ ] Run Trefle/Perenual sync to populate initial herb data
- [ ] Verify all pages render correctly
- [ ] Monitor for 72 hours

---

## Phase 10: Cleanup (Days 25-28)

- [ ] Remove `backend/` directory (Drupal)
- [ ] Remove `frontend/` directory (Next.js)
- [ ] Move `astro/` → `frontend/` (or keep as `astro/`)
- [ ] Move `directus/` → `backend/` (or keep as `directus/`)
- [ ] Update root `README.md`
- [ ] Update root `docker-compose.yml` and `docker-compose.prod.yml`
- [ ] Archive old CI/CD workflows
- [ ] Remove unused npm packages from root
- [ ] Final schema snapshot commit

---

## Verification

### Smoke tests after each phase
- **Phase 1:** Directus admin accessible, schema snapshot exports cleanly
- **Phase 3:** Astro dev server runs, design tokens render, layout components display
- **Phase 4:** All 23 API routes return expected responses against Directus
- **Phase 5:** All pages render with Directus data, herb detail page shows all sections
- **Phase 6:** Symptom checker works end-to-end, maps render, search returns results
- **Phase 7:** Trefle sync creates herbs in Directus, geocoding populates coordinates
- **Phase 8:** CI/CD deploys successfully, Cloudflare Pages serves frontend
- **Phase 9:** All E2E tests pass, no console errors in production

### Performance targets
- Herb detail page: < 200ms TTFB (Cloudflare edge)
- API response (herb with all relations): < 100ms (Directus + Redis cache)
- Search results: < 50ms (MeiliSearch)
- Lighthouse score: > 95 Performance, 100 Accessibility

### Rollback plan
- Keep Drupal + Next.js running on Coolify during transition (separate subdomains)
- DNS switch is reversible within minutes
- Database is separate (new Directus DB, old Drupal DB untouched)
