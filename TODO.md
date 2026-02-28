# Verscienta Health - Comprehensive TODO List

**Last Updated:** 2026-02-27
**Overall Progress:** ~98% complete (core platform); feature gap analysis added in §12

---

## Summary

| Category | Progress | Notes |
| ---------- | ---------- | -------- |
| Frontend Pages | 100% | 26 pages built; all pages use DesignSystem consistently |
| Frontend Components | 100% | 35+ components (DarkModeToggle, LanguageSwitcher, Navigation, FavoriteButton, ReviewForm, BookingForm) |
| Frontend API Routes | 100% | 11 routes (auth, grok, reviews, bookings, verify-email) |
| Backend Setup | 100% | Drupal running, all content types, fields, taxonomies, entity refs, paragraph types, security hardening |
| External Services | 55% | Algolia configured + TCM enrichment, SymPy service built |
| Testing | 88% | Jest + RTL (148 tests / 13 suites), Playwright E2E (5 spec files) |
| Deployment | 80% | Docker setup, CI/CD workflows (test.yml, lint.yml), PWA manifest |
| Documentation | 80% | Good docs, DATA_SOURCES.md added, needs API documentation |
| TCM Data Pipeline | 100% | Ingestion scripts, content types, knowledge graph, Algolia enrichment |

---

## CURRENT STATUS (2026-01-22)

### Working Now

- DDEV running at <https://backend.ddev.site>
- Drupal 11.2.5 installed and configured
- JSON:API endpoints working
- OAuth 2.0 configured (Client ID: e6ab6cee-b624-4103-8b06-ccff335ca6f7)
- Content types created: herb, modality, condition, practitioner, symptom, review, grok_insight, formula
- 6 taxonomy vocabularies with 150+ terms (setup scripts run)
- 34 entity reference fields for cross-linking (setup scripts run)
- 65+ additional content fields (setup scripts run)
- Sample content created (herbs, modalities, conditions)
- Custom module holistic_hub enabled (geocoding)
- Turbopack enabled for faster development builds
- All listing pages redesigned with consistent design system
- Global toast notifications integrated
- Skeleton loading components created
- Error boundary components created
- **NEW:** Algolia search indexing configured and working
- **NEW:** Security headers configured (XSS, HSTS, etc.)
- **NEW:** Sort dropdown on all listing pages
- **NEW:** Content Security Policy (CSP) header added
- **NEW:** Server-side pagination on all listing pages
- **NEW:** Rate limiting on all API routes
- **NEW:** Zod validation for all forms
- **NEW:** Improved search page with Algolia Stats and Pagination

### Next Steps

1. ~~**Run backend setup scripts** when DDEV is started~~ (DONE)
2. ~~Configure Algolia~~ (DONE - `npm run index-algolia`)
3. Configure external services (Turnstile, xAI API keys)
4. Create frontend .env.local from .env.example
5. Start frontend and test integration
6. Export Drupal configuration: `ddev drush cex`
7. ~~Add sort/filter functionality to listings~~ (DONE - SortDropdown added)

---

## 1. BACKEND - Drupal Setup (MOSTLY COMPLETE)

### 1.1 Drupal Installation & Configuration

- [x] Complete DDEV setup
- [x] Run Drupal site installation
- [x] Enable core modules (jsonapi, rest, serialization, content_translation, locale)
- [x] Enable contributed modules:
  - [x] search_api
  - [x] webform
  - [x] pathauto
  - [x] metatag
  - [x] json_field
  - [x] jsonapi_extras
  - [ ] redis (optional - for caching)
  - [x] conditional_fields
  - [x] field_group
  - [x] paragraphs
  - [x] geofield
  - [x] simple_oauth
  - [x] facets
  - [x] media
  - [x] focal_point

### 1.2 Content Types Creation (COMPLETE - scripts created)

- [x] **Herb** content type (comprehensive)
  - [x] Botanical information fields (scientific_name, family, genus, species)
  - [x] TCM properties (temperature, flavor, channel entry)
  - [x] Western herbalism properties
  - [x] Common names, parts used, harvest season
  - [x] Dosage forms
  - [x] Safety/contraindications
  - [x] Cultural/historical fields
  - [x] Quality standards/indicators
  - [x] Cross-references (related herbs, conditions, modalities, formulas)
- [x] **Modality** content type (comprehensive)
  - [x] field_excels_at, field_key_benefits
  - [x] Related conditions (entity reference)
  - [x] Related practitioners (entity reference)
  - [x] Evidence level, training requirements
- [x] **Condition** content type (comprehensive)
  - [x] Symptoms list, severity level
  - [x] Related herbs, modalities, practitioners
  - [x] Holistic approach, lifestyle recommendations
- [x] **Practitioner** content type (comprehensive)
  - [x] Practice type, credentials, license number
  - [x] Address fields (street, city, state, postal, country)
  - [x] Latitude/Longitude for geocoding
  - [x] Modalities practiced (entity reference)
  - [x] Accepting new patients, offers telehealth
- [x] **Formula** content type (comprehensive)
  - [x] Chinese/Pinyin names, classic source
  - [x] Actions, indications, contraindications
  - [x] Herbs in formula (entity reference)
- [x] **Review** content type (comprehensive)
  - [x] Rating, review title, verified status
  - [x] References to herbs, practitioners, modalities, formulas
- [x] **GrokInsight** content type (comprehensive)
  - [x] Insight type, confidence score
  - [x] References to herbs, conditions, modalities

**Scripts created:**

- `/backend/scripts/setup-entity-references.sh` - 34 entity reference fields
- `/backend/scripts/setup-additional-fields.sh` - 65+ additional fields
- `/backend/scripts/create-sample-content.sh` - Sample content
- `/backend/scripts/setup-all.sh` - Master setup script

### 1.3 Taxonomies (COMPLETE - script created)

- [x] Herb Family vocabulary (20 botanical families)
- [x] Modality Category vocabulary (14 categories)
- [x] TCM Categories vocabulary (30+ categories)
- [x] Herb Tags vocabulary (40+ tags)
- [x] Body Systems vocabulary (13 systems)
- [x] Therapeutic Actions vocabulary (27 actions)
Script: `/backend/scripts/setup-taxonomies.sh`

### 1.4 Paragraph Types (script: `setup-paragraph-types.sh`)

- [x] herb_common_name
- [x] tcm_properties
- [x] active_constituent
- [x] clinical_study
- [x] dosage_info
- [x] drug_interaction
- [x] toxicity_info
- [x] preparation_method
- [x] storage_info
- [x] sourcing_info
- [x] quality_standard
- [x] adulteration_info
- [x] safety_warning
- [x] historical_text
- [x] practitioner_note
- [x] case_study
- [x] regulatory_info
- [x] external_id
- [x] contributor
- [x] reference
- [x] image_info

### 1.5 OAuth & Security

- [ ] Configure Simple OAuth module
- [ ] Generate OAuth key pair (private.key, public.key)
- [ ] Create OAuth client for Next.js frontend
- [ ] Configure user roles and permissions:
  - [ ] Anonymous (view only)
  - [ ] Authenticated (reviews, favorites)
  - [ ] Herbalist (create/edit herbs)
  - [ ] TCM Practitioner (TCM-specific content)
  - [ ] Peer Reviewer (review submissions)
  - [ ] Editor (publish content)
  - [ ] Administrator (full access)

### 1.6 Views & API Endpoints

- [ ] Create Views for JSON:API endpoints
- [ ] Configure jsonapi_extras for custom endpoints
- [ ] Set up search_api indexes
- [ ] Configure Redis caching

---

## 2. FRONTEND - Pages (MOSTLY COMPLETE)

### 2.1 Pages Updated with Design System

- [x] `/herbs` - Redesigned with breadcrumbs, temperature badges, featured section
- [x] `/modalities` - Redesigned with icon mapping, category highlights, CTA
- [x] `/conditions` - Redesigned with severity badges, symptom checker CTA
- [x] `/practitioners` - Redesigned with practice type stats, accepting patients badges
- [x] `/formulas` - Redesigned with use case highlights, herb formula education section
- [x] `/login` - Split-screen layout, show/hide password, social login placeholders
- [x] `/register` - 2-step form, password strength indicator, terms agreement

### 2.2 New Pages Created

- [x] `/about` - About us page
- [x] `/contact` - Contact form page
- [x] `/privacy` - Privacy policy page
- [x] `/terms` - Terms of service page
- [x] `/faq` - FAQ page with search and category filtering
- [x] `/forgot-password` - Password reset request page
- [x] `/reset-password` - Token-based password reset page

### 2.3 Detail & Utility Pages - Design System Upgrades (2026-02)

- [x] `/search` - PageWrapper, LeafPattern, hero, BackLink, metadata layout
- [x] `/symptom-checker` - PageWrapper, LeafPattern, hero, DisclaimerBox, Section, BotanicalDivider, Tag, BackLink
- [x] `/modalities/[id]` - PageWrapper, hero, Section, BotanicalDivider, Tag, DisclaimerBox, BackLink
- [x] `/conditions/[id]` - PageWrapper, hero, Section, BotanicalDivider, Tag, DisclaimerBox, BackLink
- [x] `/formulas/[id]` - PageWrapper, hero, Section, BotanicalDivider, Tag, DisclaimerBox, BackLink
- [x] `/herbs/[id]` - PageWrapper, DesignSystem Section/BotanicalDivider/Tag, DisclaimerBox, BackLink
- [x] `/practitioners/[id]` - PageWrapper, hero, Section, Tag, DisclaimerBox, BackLink
- [x] `/clinics` - PageWrapper, LeafPattern, hero, Tag, BackLink
- [x] `/clinics/[id]` - PageWrapper, hero, Section, Tag, DisclaimerBox, BackLink
- [x] `/login` - PageWrapper, BackLink, earth palette, form card styling, metadata layout
- [x] `/register` - PageWrapper, BackLink, earth palette, form card styling, metadata layout
- [x] `/contact` - PageWrapper, LeafPattern, BackLink, DesignSystem components, metadata layout
- [x] `/forgot-password` - PageWrapper, BackLink, earth palette, metadata layout
- [x] `/reset-password` - PageWrapper, BackLink, earth palette, metadata layout
- [x] `/privacy` - PageWrapper, LeafPattern, hero, BackLink, metadata layout
- [x] `/terms` - PageWrapper, LeafPattern, hero, BackLink, metadata layout
- [x] `/faq` - PageWrapper, LeafPattern, hero, BackLink, earth palette, metadata layout
- [x] `/profile` - PageWrapper, BackLink, earth palette, metadata layout

### 2.4 Missing Functionality

- [x] Email verification flow
- [x] User favorites/bookmarks system
- [x] User reviews submission
- [x] Practitioner booking request

---

## 3. FRONTEND - Components & Features (MOSTLY COMPLETE)

### 3.1 UI Components Created

- [x] Breadcrumbs component
- [x] Pagination component
- [x] FilterPanel component (with MobileFilterDrawer)
- [x] PractitionerCard component
- [x] ConditionCard component
- [x] ReviewCard component (with ReviewSummary)
- [x] FormulaCard component (with FormulaIngredientList)
- [x] Skeleton components (SkeletonText, SkeletonCard, SkeletonHerbCard, SkeletonPractitionerCard, SkeletonTable, SkeletonDetailPage, SkeletonGrid, etc.)
- [x] ErrorBoundary component (with ErrorFallback, InlineError, NotFoundError, APIError)
- [x] NewsletterSignup component (4 variants: default, compact, card, footer)
- [x] Toast component enhanced with ToastProvider and useToast hook
- [x] Footer component (comprehensive) - updated in layout.tsx
- [x] MobileMenu component (hamburger nav) - integrated in Header.tsx
- [x] LanguageSwitcher component
- [x] DarkModeToggle component
- [x] Navigation component (separate from header)

### 3.2 Feature Enhancements

- [x] Toast notifications integration (global provider in layout)
- [x] Loading skeletons for better UX
- [x] Error boundaries for graceful error handling
- [x] Newsletter signup component
- [x] Turbopack enabled for faster dev builds
- [x] Image optimization (WebP/AVIF, lazy loading, OptimizedImage component)
- [x] Server-side pagination for listings (ServerPagination component)
- [x] Sort functionality for listings (SortDropdown component)
- [x] Advanced filtering (faceted search) — TCM temperature, taste, meridians facets on search page + Algolia faceting attributes configured

### 3.3 Accessibility

- [x] Screen reader testing (skip-to-content, aria-labels, roles)
- [x] Keyboard navigation audit (focus-visible, Escape key support)
- [ ] Color contrast verification
- [ ] WCAG 2.1 AA compliance check
- [x] aria-labels where needed
- [x] Focus management (focus-visible styles, prefers-reduced-motion)

---

## 4. EXTERNAL SERVICES CONFIGURATION (HIGH PRIORITY)

### 4.1 Algolia Search (COMPLETE)

- [x] Create Algolia account
- [x] Create search index
- [x] Configure searchable attributes
- [x] Configure facets
- [x] Set up API keys in .env
- [x] Index Drupal content (manual or automated)
- [x] Create indexing script (`npm run index-algolia`)
- [ ] Create Drupal hook for content sync on save/update (optional)
- [x] Add TCM fields to Algolia herb transform (latin_name, pinyin_name, taste, temperature, meridians)
- [x] Update searchable attributes for TCM fields

### 4.2 Grok AI (xAI)

- [ ] Obtain xAI API key
- [ ] Add to .env (XAI_API_KEY)
- [ ] Test symptom analysis endpoint
- [ ] Configure rate limiting
- [ ] Set up Redis caching for responses

### 4.5 SymPy Compute Service

- [x] Create Python FastAPI microservice (`services/sympy-compute/`)
- [x] Add DragonflyDB cache container to Docker stack
- [x] Create Next.js proxy route (`/api/symbolic-compute`)
- [x] Create TypeScript client library (`lib/sympy-compute.ts`)
- [x] Add Zod validation schemas for symbolic/dosage requests
- [x] Add `symbolic` rate limit tier (15 req/min)
- [x] Add environment variables to `.env.example` files
- [ ] Deploy and test with `docker compose up`
- [ ] Run Python tests (`pytest`)
- [x] Integrate dosage computation into herb detail pages (SymbolicVerifyButton in dosage section)
- [x] Integrate symbolic math into formula detail pages (SymbolicVerifyButton in ingredients table)
- [ ] Integrate symbolic math into formula builder (requires formula builder feature)

### 4.3 Cloudflare Turnstile

- [ ] Create Cloudflare account
- [ ] Set up Turnstile widget
- [ ] Get site key and secret key
- [ ] Add to .env
- [ ] Integrate on registration form
- [ ] Integrate on login form
- [ ] Integrate on contact form

### 4.4 OAuth Configuration

- [ ] Generate Drupal OAuth credentials
- [ ] Add to frontend .env:
  - [ ] DRUPAL_CLIENT_ID
  - [ ] DRUPAL_CLIENT_SECRET
- [ ] Test full auth flow (register, login, logout)

---

## 5. SECURITY (HIGH PRIORITY)

### 5.1 Frontend Security

- [x] Complete Zod validation schemas for all forms
- [x] Rate limiting middleware for API routes (all 7 routes)
- [x] CSRF protection implementation (Double Submit Cookie pattern)
- [x] Secure HTTP headers (next.config.ts)
- [x] Content Security Policy (added to next.config.ts)
- [x] Input sanitization (lib/sanitize.ts utilities)

### 5.2 Backend Security

- [x] Configure trusted host patterns (env-based in settings.local.php)
- [x] Set up secure file permissions (setup-security.sh)
- [x] Database backup strategy (backup-database.sh script)
- [x] Audit module for logging (dblog configured, syslog enabled)
- [x] Password policy configuration (strength enforcement, flood control)

---

## 6. INTERNATIONALIZATION (LOW PRIORITY)

### 6.1 i18n Setup

- [ ] Configure next-i18next
- [ ] Create translation files:
  - [ ] `public/locales/en/common.json`
  - [ ] `public/locales/es/common.json`
  - [ ] `public/locales/zh-CN/common.json`
  - [ ] `public/locales/zh-TW/common.json`
- [x] Create LanguageSwitcher component
- [ ] Test language switching
- [ ] Enable Drupal content translation
- [ ] Sync translations between Drupal and Next.js

---

## 7. TESTING (MEDIUM PRIORITY)

### 7.1 Frontend Testing

- [x] Set up Jest + React Testing Library
- [x] Write component tests (csrf, sanitize, validation, rate-limit, useFavorites, LatexEquation, SymbolicVerifyButton, useSymbolicVerification)
- [x] Write API route tests (symbolic-feedback: 9 tests, knowledge-graph: 6 tests)
- [x] Write lib tests (formula-similarity: 21 tests, analytics: 6 tests, sympy-compute: 10 tests)
- [x] Write hook tests (useFavorites)
- [x] Set up Playwright for E2E tests
- [x] Write E2E tests:
  - [x] Homepage navigation
  - [x] Search functionality
  - [x] Authentication flow
  - [x] Symptom checker flow
  - [x] Herb/modality detail views (listing pages + static pages)

### 7.2 Backend Testing

- [ ] Set up PHPUnit for Drupal
- [ ] Write custom module tests
- [ ] Write hook tests
- [ ] Test JSON:API endpoints

### 7.3 Target Metrics

- [ ] 80%+ code coverage (frontend)
- [ ] All critical paths tested
- [ ] Accessibility tests passing

---

## 8. PERFORMANCE OPTIMIZATION (LOW PRIORITY)

### 8.1 Frontend Performance

- [ ] Run Lighthouse audit
- [x] Optimize images (AVIF/WebP format, OptimizedImage component)
- [x] Implement code splitting (Next.js automatic code splitting)
- [x] Lazy load components (dynamic imports, lazy loading images)
- [x] Configure ISR (Incremental Static Regeneration) — 300s revalidate on all listing + detail pages
- [ ] Add service worker for caching
- [x] Optimize bundle size (compression enabled, static asset caching)

### 8.2 Backend Performance

- [ ] Enable Redis caching
- [ ] Configure Views caching
- [ ] Add database indexes
- [ ] Enable page/dynamic cache

### 8.3 Performance Targets

- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Accessibility > 90
- [ ] Lighthouse Best Practices > 90
- [ ] Lighthouse SEO > 90

---

## 9. DEPLOYMENT & CI/CD (MEDIUM PRIORITY)

### 9.1 CI/CD Pipeline

- [x] Create `.github/workflows/test.yml` - Run tests on PR (unit + E2E)
- [x] Create `.github/workflows/lint.yml` - Run linting + type checking
- [x] Create `.github/workflows/deploy-frontend.yml` - lint+test gate → build GHCR image → trigger Coolify
- [x] Create `.github/workflows/deploy-backend.yml` - build Drupal + SymPy GHCR images → trigger Coolify
- [ ] Configure environment secrets in GitHub (see COOLIFY-DEPLOYMENT.md for secret names)

### 9.2 Frontend Deployment

- [x] Dockerfile already exists (`frontend/Dockerfile`) — multi-stage, standalone output, Coolify-ready
- [x] Configure environment variables (build-args in deploy-frontend.yml + runtime env in docker-compose.prod.yml)
- [ ] Set up custom domain (configure DNS + Coolify domain settings)
- [ ] Configure SSL (Coolify auto-provisions Let's Encrypt; nginx/ssl/ for self-hosted)
- [ ] Set up CDN (Cloudflare proxy recommended in front of Coolify)

### 9.3 Backend Deployment

- [x] Finalize docker-compose for production (`docker-compose.prod.yml` — MariaDB, nginx, resource limits, internal network)
- [x] Configure production settings.php (`backend/docker/settings.local.php` reads all config from env vars)
- [x] Set up database backups (daily) (`scripts/backup.sh` — mysqldump + gzip + optional S3 upload)
- [x] Configure file system backups (weekly) (`scripts/backup.sh --full` — Drupal files + private/ tar.gz)
- [ ] Set up monitoring (uptime, errors) (recommend UptimeRobot free tier + Coolify metrics)
- [x] Configure reverse proxy (nginx) (`nginx/conf.d/verscienta.conf` — HTTP→HTTPS, upstream proxying, cache headers)

---

## 10. CONTENT POPULATION (AFTER BACKEND SETUP)

### 10.1 Initial Content

- [ ] Add 10-20 sample herbs with full data
- [ ] Add 10-15 modalities with descriptions
- [ ] Add 20-30 common conditions
- [ ] Add 5-10 sample practitioners
- [ ] Add 5-10 classical formulas
- [ ] Add sample reviews

### 10.2 Content Import / TCM Data Pipeline

- [x] Create Python ingestion pipeline (`scripts/tcm-ingest/`)
- [x] HERB 2.0 CSV ingest script (`ingest_herb2.py`)
- [x] BATMAN-TCM predicted interactions ingest (`ingest_batman.py`)
- [x] PubChem molecular enrichment (`enrich_pubchem.py`)
- [x] Drupal JSON:API client with upsert logic (`drupal_client.py`)
- [x] Field mapping from CSV to Drupal (`field_mapper.py`)
- [x] Monthly cron update script (`cron-update.sh`)
- [x] Create TCM content types setup script (`setup-tcm-content-types.sh`)
- [x] Document data sources (`DATA_SOURCES.md`)
- [ ] Download HERB 2.0 data and run initial ingest
- [ ] Download BATMAN-TCM data and run ingest
- [ ] Run PubChem enrichment
- [ ] Verify data integrity post-ingest

---

## 11. NICE-TO-HAVE FEATURES (LOW PRIORITY)

### 11.1 Dark Mode

- [x] Implement CSS variables for dark theme
- [x] Create DarkModeToggle component
- [x] Persist preference (localStorage)
- [x] Respect system preference

### 11.2 PWA Features

- [x] Create manifest.json
- [ ] Configure service worker
- [ ] Implement offline caching
- [ ] Add install prompt

### 11.3 Real-Time Features

- [ ] Set up Socket.io (if needed)
- [ ] Live chat/chatbot
- [ ] Real-time notifications
- [ ] Online practitioner status

### 11.4 Admin Dashboard

- [x] Create `/admin` page
- [x] Quick stats display
- [x] Link to Drupal admin
- [x] Content overview
- [x] Knowledge Graph viewer (`/admin/knowledge-graph`) — herb → ingredient → target → condition visualization with react-force-graph-2d, feature-flagged via `NEXT_PUBLIC_KNOWLEDGE_GRAPH=true`

### 11.5 Advanced Features

- [x] User reviews & ratings system
- [x] Practitioner booking system
- [ ] E-commerce integration (herb sales)
- [ ] User forums/community
- [ ] Mobile app (React Native)

---

## 12. FEATURE GAP ANALYSIS — vs. meandqi.com & americandragon.com

Research date: 2026-02-27. Compared Verscienta against meandqi.com (504 herbs, 362 formulas, 276 patterns, 360 acupuncture points, 1,362 conditions, 120 TCM concepts) and americandragon.com (deep clinical content, two-herb combinations, 400+ acupuncture points, full condition→pattern→formula→points chain).

### 12.1 HIGH PRIORITY — Core clinical content missing

- [ ] **Acupuncture Points database** (`/points`, `/points/[id]`)
  - Content type: `acupuncture_point` with channel/meridian, location, needle depth, needle angle, moxa suitability, cautions/contraindications, actions, indications
  - meandqi.com has 360 points; americandragon.com has 400+
  - Backend: new content type + setup script
  - Frontend: listing page, detail page, filter by channel

- [ ] **TCM Patterns / Syndromes database** (`/patterns`, `/patterns/[id]`)
  - Content type: `tcm_pattern` with pattern name (Chinese + Pinyin), etiology, pathomechanism, signs & symptoms, tongue criteria, pulse criteria, treatment principle, differential diagnosis notes
  - meandqi.com has 276 patterns; critical for clinical differentiation
  - Links to: formulas, herbs, acupuncture points, conditions
  - Backend: new content type + entity references
  - Frontend: listing page, detail page, filter by organ system

- [ ] **Condition → Pattern → Formula → Points clinical chain**
  - The full clinical workflow: a condition differentiates into patterns, each pattern maps to formulas and point combinations
  - Currently Verscienta has conditions and formulas but no intermediate pattern layer
  - Requires: TCM Patterns database (above) + entity reference fields linking condition→patterns, pattern→formulas, pattern→points
  - Frontend: condition detail page shows "Common TCM Patterns" section; pattern detail shows recommended formulas and point combinations

### 12.2 MEDIUM PRIORITY — Herb & Formula depth

- [ ] **Chinese characters (Hanzi) field on herbs and formulas**
  - `field_herb_chinese_name` (string) on herb; `field_formula_chinese_name` on formula
  - Display alongside English and Pinyin: "Asian Ginseng (Ren Shen / 人参)"
  - americandragon.com displays characters throughout; most practitioners expect them
  - Backend: add fields via `setup-additional-fields.sh`
  - Frontend: update `herbDisplayName()` utility + all herb/formula display components

- [ ] **Two-herb combination pairings section on herb detail pages**
  - americandragon.com shows "Herb Pairings" — pairs of herbs that synergize (e.g., Huang Qi + Dang Shen)
  - Content type: `herb_pairing` or paragraph type on herb with: partner herb (entity ref), synergistic action, example formula
  - Frontend: new "Herb Pairings" section on `/herbs/[id]`

- [ ] **Tongue and pulse diagnosis on herb pages**
  - americandragon.com lists tongue appearance and pulse quality that indicate use of each herb
  - Fields: `field_tongue_indication`, `field_pulse_indication` (text fields) on herb
  - Frontend: display in herb detail indications section

- [ ] **Formula jia jian (加减) modifications as structured UI**
  - meandqi.com and americandragon.com show "Add X herb for Y symptom / Remove Z herb if A"
  - Currently formulas have `field_modification_notes` (free text) and parent/child formula family
  - Enhancement: paragraph type `formula_modification` (condition text + herb entity ref + add/remove flag)
  - Frontend: "Modifications" accordion section on formula detail

- [ ] **Formula biomedical cross-references (Western conditions)**
  - americandragon.com cross-references each formula to Western biomedical conditions (ICD-10 codes or plain text)
  - Field: `field_biomedical_conditions` (text list or entity ref to condition) on formula
  - Frontend: "Biomedical Equivalent" section on formula detail

- [ ] **Structured TCM Concepts / Theory database** (`/concepts`, `/concepts/[id]`)
  - meandqi.com has 120 TCM concept pages (Qi, Blood, Yin/Yang, Five Elements, etc.)
  - Content type: `tcm_concept` with explanation, clinical relevance, related patterns, related herbs
  - Primarily educational content; useful for patient-facing explanations

### 12.3 LOWER PRIORITY — Clinical depth additions

- [ ] **Herb processing variations (Paozhi 炮製)**
  - Each herb can have multiple processed forms (raw, honey-fried, salt-processed, wine-processed) with different properties
  - Paragraph type: `herb_processing` (processing method, effect on properties, indication change)
  - americandragon.com documents major processing variations

- [ ] **Formula historical source citations**
  - Fields already exist (`field_classic_source`) but no structured display
  - Add: `field_source_dynasty`, `field_source_author`, `field_source_year` for proper academic citation
  - Frontend: display as formatted citation in formula detail header

- [ ] **Pattern differentiation engine in Symptom Checker**
  - Currently uses Grok AI for freeform analysis
  - Enhancement: structured output that maps symptoms → TCM patterns → recommended formulas + points
  - Requires TCM Patterns database to be populated first
  - Could be a Grok prompt enhancement that returns structured JSON with pattern matches

- [ ] **E-commerce / practitioner product integration**
  - meandqi.com links to herb/formula products for sale
  - Low priority but high revenue potential — affiliate links or direct store integration
  - Would require: `field_product_url` (URL) on herb and formula, "Buy" button on detail pages

### 12.4 Impact vs. Effort Matrix

| Feature | Patient Impact | Practitioner Impact | Effort | Priority |
|---|---|---|---|---|
| Acupuncture Points DB | Medium | **High** | Medium | **HIGH** |
| TCM Patterns DB | Medium | **High** | Medium | **HIGH** |
| Condition→Pattern→Formula chain | Medium | **High** | Low (once above exist) | **HIGH** |
| Chinese characters (Hanzi) | Low | **High** | Low | **MEDIUM** |
| Herb pairings | Low | Medium | Medium | **MEDIUM** |
| Formula jia jian UI | Low | **High** | Medium | **MEDIUM** |
| Biomedical cross-refs | **High** | Medium | Low | **MEDIUM** |
| TCM Concepts DB | **High** | Low | High | MEDIUM |
| Tongue/pulse on herbs | Low | Medium | Low | LOW |
| Processing variations | Low | Medium | Medium | LOW |
| Pattern differentiation in symptom checker | **High** | Medium | High | LOW (needs Patterns DB first) |
| E-commerce | **High** | Low | High | LOW |

---

## 13. COMPETITIVE DIFFERENTIATORS — Features Neither meandqi.com nor americandragon.com Have

Both competitor sites are static reference databases with no accounts, no AI, and no interactivity beyond browsing. These features would make Verscienta categorically different.

### 13.1 Safety-Critical (highest clinical differentiation value)

- [ ] **Herb-Drug Interaction Checker** (`/tools/herb-drug-interactions`)
  - User enters current Western medications (text input or drug name autocomplete), gets flagged herbs/formulas to avoid with severity rating (contraindicated / caution / monitor)
  - Data source: Natural Medicines database (licensed), NatMedPro, or curated from published interaction literature
  - Backend: new `herb_drug_interaction` content type (herb entity ref, drug name, mechanism, severity, evidence level)
  - Frontend: standalone tool page + inline warning badges on herb/formula detail pages
  - This is the single most clinically valuable thing a TCM reference site could add

- [ ] **Pregnancy & Lactation Safety Ratings**
  - Structured `field_pregnancy_safety` and `field_lactation_safety` fields on herb: tiered rating (avoid / caution / likely safe / insufficient data)
  - Both competitors have contraindications in free-text only — no structured safety tiers
  - Frontend: prominent badge in herb detail sidebar, filter on `/herbs` listing by safety rating
  - Backend: add fields via `setup-additional-fields.sh`

### 13.2 AI-Powered (leveraging existing Grok integration)

- [ ] **TCM Constitution Assessment → Personalized Recommendations**
  - Guided questionnaire (15-20 questions) based on Ba Gang (Eight Principles: Yin/Yang, Interior/Exterior, Cold/Heat, Deficiency/Excess) or Five Element typing
  - User answers questions → receives TCM constitution profile → personalized herb and formula recommendations
  - Backend: store constitution results in user profile (`field_tcm_constitution`)
  - Frontend: new `/tools/constitution-assessment` page; results link to relevant herbs, formulas, patterns
  - Neither competitor has any interactive diagnostic tool

- [ ] **"Explain This Formula to My Patient" Generator**
  - Button on every formula detail page — calls Grok with the formula's ingredients, actions, and indications
  - Returns plain-English explanation (no TCM jargon) formatted as a printable patient handout
  - Grok is already integrated — this is a new prompt + print-optimized output component
  - Frontend: "Patient Handout" button → modal with formatted text + print/copy/PDF actions

- [ ] **PubMed Research Integration**
  - Surface PubMed abstracts on herb and formula pages, AI-summarized by Grok into plain English with evidence strength rating (strong / moderate / limited / emerging / none)
  - Verscienta already imports HERB 2.0 molecular target data — extend to show the full evidence chain: molecular target → published study → clinical outcome
  - Backend: `tcm_clinical_evidence` content type already exists; add PubMed ID field + fetch-on-demand API route
  - Frontend: "Research Evidence" accordion section on herb and formula detail pages

### 13.3 Practitioner Tools (neither competitor has practitioner accounts)

- [ ] **Digital Prescription Pad / Patient Handout PDF Generator**
  - Practitioner builds a protocol (formula + adjunct herbs + lifestyle/dietary recommendations) and generates a branded PDF
  - PDF includes: formula name (English/Pinyin/Chinese), ingredient list with quantities and percentages, preparation instructions, dosage, dietary recommendations, practitioner contact info
  - Frontend: new `/practitioner/prescription` page; uses existing practitioner account system
  - Tech: `@react-pdf/renderer` or server-side PDF generation via Puppeteer/html-to-pdf

- [ ] **Patient Symptom Journal / Progress Tracking**
  - Patients log daily/weekly symptoms on a simple scale, tied to their active treatment protocol
  - Practitioners can view trend charts for their patients
  - Backend: new `symptom_log` content type (user ref, date, symptom list, severity scores, notes)
  - Frontend: `/profile/journal` for patients; `/practitioner/patients/[id]` dashboard for practitioners
  - Neither competitor has any concept of a logged-in patient with persistent data

- [ ] **Practitioner Case Study Sharing** (community / gated)
  - Practitioners post anonymized clinical cases: pattern diagnosis → formula/herb protocol → outcome after N weeks
  - Peer-reviewable by other practitioners (leverages existing review/rating system)
  - Backend: new `case_study` content type (pattern ref, formula refs, herb refs, treatment duration, outcome summary, practitioner ref)
  - Frontend: `/community/cases` listing; `/community/cases/[id]` detail; gated to practitioner role

### 13.4 Data Depth (leveraging existing HERB 2.0 / BATMAN-TCM / PubChem pipeline)

- [ ] **Molecular Targets Section on Herb Detail Pages**
  - Verscienta already imports BATMAN-TCM target interaction data — surface it as a human-readable section
  - Display: "This herb acts on 12 known protein targets including TNF-α, COX-2, IL-6" with links to relevant conditions
  - No TCM reference site currently surfaces molecular pharmacology in readable form — unique clinical credibility signal
  - Frontend: new "Molecular Pharmacology" section on `/herbs/[id]`; pull from existing `tcm_target_interaction` content type
  - Effort: low — data already ingested, just needs display component

- [ ] **Formula Network / Relationship Map**
  - Interactive visualization showing how formulas relate: shared herbs, formula family lineage, overlapping conditions treated
  - Verscienta already has formula family (parent/child) and knowledge graph infrastructure (`react-force-graph-2d`)
  - Frontend: "Formula Network" tab on formula detail page using existing graph component
  - Effort: low — graph component and data already exist

### 13.5 Practical UX (quick wins — neither competitor has any of these)

- [ ] **QR Code Generation on content pages**
  - Every herb, formula, condition, and point page has a "Share / QR" button
  - Practitioners print QR codes for office displays; patients scan to access reference info
  - Tech: `qrcode` npm package (tiny, no deps); render as SVG inline or downloadable PNG
  - Effort: very low

- [ ] **Print-Optimized Stylesheets**
  - `@media print` CSS on herb monograph and formula detail pages
  - Hides navigation, sidebars, and interactive elements; formats as clean one-pager
  - Practitioners frequently want a printed reference sheet for desk or patient handout
  - Effort: very low (CSS only)

- [ ] **Weight-Based Dose Calculator** (extends existing SymPy service)
  - Practitioner enters patient weight (kg/lbs) and age group (adult/pediatric/geriatric)
  - SymPy compute service already handles unit conversion and dosage math
  - Frontend: inline calculator widget on herb detail dosage section + formula ingredients table
  - Effort: low — SymPy service built; needs UI widget + API prompt extension

### 13.6 Differentiator Priority Matrix

| Feature | Uniqueness | Patient Value | Practitioner Value | Effort |
|---|---|---|---|---|
| Herb-drug interaction checker | Very high | Very high | Very high | High |
| Pregnancy/lactation safety ratings | High | Very high | High | Low |
| Constitution assessment quiz | High | High | High | Medium |
| Molecular targets on herb pages | Very high | Medium | High | **Low** |
| "Explain to patient" Grok button | High | High | High | **Low** |
| Formula network map | High | Medium | Medium | **Low** |
| Print stylesheets | Medium | Medium | High | **Very low** |
| QR code generation | Medium | Medium | High | **Very low** |
| Digital prescription pad / PDF | High | High | Very high | Medium |
| Patient symptom journal | High | High | High | Medium |
| PubMed research integration | High | Medium | High | Medium |
| Practitioner case studies | High | Medium | High | High |
| Weight-based dose calculator | High | Medium | High | Low |

---

## PRIORITY ORDER FOR IMPLEMENTATION

### Phase 1 - Foundation (Critical - Do First) ✅ MOSTLY COMPLETE

1. ✅ Complete Drupal setup (DDEV/WSL2)
2. ✅ Create content types
3. ✅ Configure OAuth
4. Configure external services (Algolia, Turnstile, xAI)
5. Test full auth flow

### Phase 2 - Core Features (High Priority) ✅ MOSTLY COMPLETE

1. Populate sample content
2. ✅ Finish page design updates
3. ✅ Add missing components
4. Complete security features

### Phase 3 - Polish (Medium Priority)

1. Write tests
2. Set up CI/CD
3. Performance optimization
4. Accessibility audit

### Phase 4 - Enhancement (Low Priority)

1. i18n setup
2. Dark mode
3. PWA features
4. Additional content pages

### Phase 5 - Intelligent Health Platform

1. ~~SymPy compute service~~ — dosage precision, constraint solving, unit conversion (DONE)
2. ~~TCM Knowledge Graph~~ — herb-ingredient-target-condition visualization (DONE — react-force-graph-2d at `/admin/knowledge-graph`)
3. ~~TCM Data Pipeline~~ — HERB 2.0, BATMAN-TCM, PubChem ingestion scripts (DONE)
4. Grok + SymPy hybrid — LLM reasoning with exact math verification
5. Pharmacokinetics modeling — absorption, half-life, bioavailability calculations
6. Formula optimization engine — multi-herb interaction analysis

---

## FILES TO CONFIGURE

### Frontend Environment (.env.local)

```env
# Drupal
NEXT_PUBLIC_DRUPAL_BASE_URL=https://backend.ddev.site
DRUPAL_CLIENT_ID=verscienta-nextjs-client
DRUPAL_CLIENT_SECRET=your-secret-here

# xAI / Grok
XAI_API_KEY=your-xai-api-key

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key

# Algolia
NEXT_PUBLIC_ALGOLIA_APP_ID=your-app-id
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=your-search-key
ALGOLIA_ADMIN_API_KEY=your-admin-key
```

### Backend Environment

```env
# Database
POSTGRES_DB=verscienta_health
POSTGRES_USER=drupal_user
POSTGRES_PASSWORD=secure-password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

---

## RECENT CHANGES (2026-02-22)

### TCM Database Ingestion Pipeline

- **DATA_SOURCES.md** — documented HERB 2.0, BATMAN-TCM 2.0, FooDB, PubChem (formats, URLs, licenses, field descriptions)
- **setup-tcm-content-types.sh** — Drush script creating 4 new content types + 7 new herb fields:
  - `tcm_ingredient` — chemical compounds (ingredient_id, pubchem_cid, cas_number, smiles, molecular_weight, herb_sources)
  - `tcm_target_interaction` — herb/ingredient → protein target links (target_name, uniprot_id, gene_name, score, evidence_type)
  - `tcm_clinical_evidence` — clinical trial/study references (study_type, summary, outcome, source_url)
  - `import_log` — ingestion run tracking (records processed/created/updated/skipped, errors, duration)
  - Herb extended: field_herb2_id, field_pubchem_cid, field_smiles, field_molecular_weight, field_herb_source_dbs, field_herb_latin_name, field_herb_pinyin_name
- **scripts/tcm-ingest/** — Python CLI pipeline (8 files):
  - `ingest_herb2.py` — HERB 2.0 CSV → Drupal JSON:API upsert (herbs, ingredients, targets, clinical evidence)
  - `ingest_batman.py` — BATMAN-TCM predicted interactions with confidence score filtering
  - `enrich_pubchem.py` — PubChem molecular enrichment via PubChemPy
  - `drupal_client.py` — JSON:API client (search/create/update/upsert, rate limiting, dry-run mode)
  - `field_mapper.py` — CSV column → Drupal field name translation
  - `cron-update.sh` — monthly delta re-ingest cron script
- **TypeScript interfaces** — TcmIngredientEntity, TcmTargetInteractionEntity, TcmClinicalEvidenceEntity, ImportLogEntity + type guards
- **Algolia enrichment** — herb transform now includes latin_name, pinyin_name, tcm_taste, tcm_temperature, tcm_meridians; searchable attributes updated
- **Knowledge Graph** (`/admin/knowledge-graph`) — admin page with react-force-graph-2d, herb selector, depth control, force-directed visualization of herb → ingredient → target → condition relationships, feature-flagged via `NEXT_PUBLIC_KNOWLEDGE_GRAPH=true`
- **Tests**: All 96 existing tests still pass; TypeScript compiles clean

---

## RECENT CHANGES (2026-02-16)

### Frontend Pages 100% - Design System Complete

- **Auth pages:** forgot-password, reset-password - PageWrapper, BackLink, earth palette, metadata layouts
- **Legal/content:** privacy, terms - PageWrapper, LeafPattern, hero, BackLink, metadata layouts
- **Utility:** FAQ - PageWrapper, LeafPattern, hero, BackLink, earth palette, metadata layout
- **Profile** - PageWrapper, BackLink, earth palette, metadata layout
- **Herb detail** - Migrated to DesignSystem Section, BotanicalDivider, Tag; PageWrapper, DisclaimerBox, BackLink
- **Practitioner detail** - Full design system (hero, Section, Tag, DisclaimerBox, BackLink)
- **Clinics listing** - PageWrapper, LeafPattern, hero, Tag, BackLink
- **Clinic detail** - Full design system (hero, Section, Tag, DisclaimerBox, BackLink)
- All 26 frontend pages now use DesignSystem consistently

### Design System Upgrades (initial batch)

- **Detail pages** upgraded with PageWrapper, hero sections (LeafPattern, blur circles), Section, BotanicalDivider, Tag, DisclaimerBox, BackLink:
  - `/conditions/[id]` - Hero, Overview, Symptoms, Modalities, Formulas, Holistic Approach sections
  - `/formulas/[id]` - Hero, Description, Related Conditions, Ingredients, Preparation & Dosage sections
- **Auth pages** - Login and Register: PageWrapper, BackLink, earth palette (`bg-earth-50/50`), form card `border-earth-200`, metadata layouts
- **Contact page** - PageWrapper, LeafPattern from DesignSystem, BackLink, border-earth-200 on cards, metadata layout
- **Search** - Already had design system; added layout for metadata
- **Modality detail** and **Symptom Checker** - Previously upgraded with full design system
- Added `layout.tsx` with metadata for: login, register, contact

---

## RECENT CHANGES (2026-01-23)

### Security Enhancements

- Added Content Security Policy (CSP) header to `next.config.ts`
  - Allows: self, Algolia, backend.ddev.site, Cloudflare Turnstile, Google Fonts, xAI API
- Added rate limiting to all API routes using centralized utility
  - Created `lib/rate-limit.ts` with checkRateLimit, getClientIdentifier, createRateLimitHeaders
  - Auth routes: 10 requests per 15 minutes
  - API routes: 60 requests per minute
  - AI routes: 10 requests per minute
  - Search routes: 30 requests per minute
- Applied rate limiting to: login, register, logout, me, profile, symptom-analysis, follow-ups

### Search Page Improvements

- Added Algolia Stats and Pagination components
- Added EmptyQueryBoundary and NoResultsBoundary
- Added type-specific icons and colors for search results
- Added breadcrumbs and better empty state with suggestions

### Pagination

- Created `ServerPagination` component for URL-based server-side pagination
- Added pagination to all 5 listing pages (herbs, modalities, conditions, practitioners, formulas)
- PAGE_SIZE = 12 items per page
- Pagination includes first/last page buttons and page info

### Zod Validation

- Added forgotPasswordSchema, resetPasswordSchema, newsletterSchema
- Integrated Zod validation into login form with field-level errors
- Integrated Zod validation into contact form with field-level errors

---

## RECENT CHANGES (2026-01-22)

### Algolia Search Integration

- Created indexing script (`frontend/scripts/index-algolia.ts`)
- Added `npm run index-algolia` command to package.json
- Script indexes herbs, modalities, conditions, practitioners, formulas to Algolia
- Creates combined `verscienta_all` index for unified search
- Configures searchable attributes and facets automatically

### Security Headers

- Added comprehensive security headers to `next.config.ts`:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy (camera, microphone, geolocation)
  - Strict-Transport-Security (HSTS)

### Sort Functionality

- Created `SortDropdown` component (`components/ui/SortDropdown.tsx`)
- Added sort dropdown to all listing pages:
  - `/herbs` - Sort by Name (A-Z/Z-A), Newest/Oldest
  - `/modalities` - Sort by Name (A-Z/Z-A), Newest/Oldest
  - `/conditions` - Sort by Name (A-Z/Z-A), Newest/Oldest
  - `/practitioners` - Sort by Name (A-Z/Z-A), Newest/Oldest
  - `/formulas` - Sort by Name (A-Z/Z-A), Newest/Oldest
- Uses URL search params for server-side sorting

---

## RECENT CHANGES (2026-01-19)

### Pages Updated

- All 5 listing pages (herbs, modalities, conditions, practitioners, formulas) redesigned with:
  - Breadcrumbs navigation
  - Featured section for top items
  - Category/type statistics badges
  - Icon mapping based on content
  - CTA sections
  - Newsletter integration
  - Educational notes and disclaimers
- Login page: Split-screen layout, social login placeholders
- Register page: 2-step form with password strength indicator
- FAQ page: Search, category filtering, accordion
- Forgot-password and reset-password pages

### Components Created/Enhanced

- Skeleton components library (10+ variants)
- ErrorBoundary with multiple error display components
- NewsletterSignup with 4 variants
- Toast provider with global hook (useToast)

### Configuration

- Turbopack enabled in package.json
- ToastProvider integrated in root layout

### Backend Scripts Created (2026-01-19)

- `setup-taxonomies.sh` - Creates 6 vocabulary types with 150+ terms:
  - Herb Family (20 botanical families)
  - Modality Category (14 categories)
  - TCM Categories (30+ categories)
  - Herb Tags (40+ tags)
  - Body Systems (13 systems)
  - Therapeutic Actions (27 actions)
- `setup-entity-references.sh` - Creates 34 entity reference fields for cross-linking:
  - Herb ↔ Conditions, Modalities, Formulas, Taxonomies
  - Condition ↔ Herbs, Modalities, Practitioners
  - Modality ↔ Conditions, Herbs, Practitioners
  - Practitioner ↔ Modalities, Conditions, Herbs
  - Formula ↔ Herbs, Conditions, TCM Categories
  - Review ↔ All content types
  - Grok Insight ↔ Herbs, Conditions, Modalities
- `setup-additional-fields.sh` - Adds 65+ fields:
  - Herb: common names, TCM properties, quality indicators
  - Modality: excels at, benefits, evidence level
  - Condition: symptoms, severity, treatments
  - Practitioner: credentials, address, contact, ratings
  - Formula: Chinese names, actions, preparation
  - Review: rating, verified status
  - Grok Insight: type, confidence score
- `create-sample-content.sh` - Creates sample data:
  - 10 herbs (Astragalus, Ginkgo, Ashwagandha, etc.)
  - 6 modalities (TCM, Ayurveda, Acupuncture, etc.)
  - 6 conditions (Insomnia, Anxiety, etc.)
  - 4 practitioners
  - 4 formulas (Si Jun Zi Tang, Triphala, etc.)
- `setup-all.sh` - Master script to run all in correct order

---

*This TODO list should be updated as tasks are completed. Mark items with [x] when done.*
