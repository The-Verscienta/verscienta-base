# Migration Audit: Drupal 11 + Next.js → Directus + Astro 6

> Audit date: 2026-04-17
> Scope: Gap analysis of the proposed migration guide against the actual Verscienta codebase

## Current Stack Summary

| Component | Technology | Details |
|-----------|-----------|---------|
| Backend CMS | Drupal 11 | MariaDB 11, Redis 7, 5 custom modules |
| Frontend | Next.js 15 | App Router, 60+ React components, 23 API routes |
| Compute | FastAPI (SymPy) | Symbolic math & dosage calculations, DragonflyDB cache |
| Search | Algolia | 6 indices, React InstantSearch |
| AI | xAI Grok | Symptom analysis, herb-drug checks, formula explanations |
| Media | Cloudflare Images | Custom stream wrapper, queue workers, batch migration |
| Auth | OAuth 2.0 / OIDC | Drupal as identity provider, cross-domain SSO |
| CAPTCHA | Cloudflare Turnstile | Server-side verification |
| Deployment | Coolify | GHCR images, GitHub Actions CI/CD |
| Proxy | Nginx | SSL termination, routing, security headers |

---

## Content Type Inventory

### Phase 1: Base Content Types

#### 1. Herb (`node--herb`)

Comprehensive medicinal herb database entry with ~50+ fields.

**Botanical Information:**

| Field | Type | Cardinality | Required |
|-------|------|-------------|----------|
| field_herb_id | text | 1 | Yes |
| field_scientific_name | text | 1 | Yes |
| field_family | text | 1 | No |
| field_genus | text | 1 | No |
| field_species | text | 1 | No |
| field_synonyms | text | Unlimited | No |
| field_native_region | text | Unlimited | No |
| field_habitat | text_long | 1 | No |
| field_plant_type | list_string | 1 | No |
| field_parts_used | list_string | Unlimited | No |
| field_botanical_description | formatted_long | 1 | No |
| field_conservation_status | list_string | 1 | No |
| field_conservation_notes | formatted_long | 1 | No |

**Medicinal Information:**

| Field | Type | Cardinality |
|-------|------|-------------|
| field_therapeutic_uses | formatted_long | 1 |
| field_pharmacological_effects | formatted_long | 1 |
| field_contraindications | formatted_long | 1 |
| field_side_effects | formatted_long | 1 |
| field_allergenic_potential | formatted_long | 1 |

**TCM-Specific:**

| Field | Type | Cardinality |
|-------|------|-------------|
| field_tcm_taste | list_string | Unlimited |
| field_tcm_temperature | list_string | 1 |
| field_tcm_meridians | list_string | Unlimited |
| field_tcm_functions | formatted_long | 1 |
| field_tcm_category | list_string | 1 |

**Western Properties:**

| Field | Type | Cardinality |
|-------|------|-------------|
| field_western_properties | list_string | Unlimited |
| field_dosage_forms | list_string | Unlimited |

**Cultural & Historical:**

| Field | Type | Cardinality |
|-------|------|-------------|
| field_traditional_american_uses | formatted_long | 1 |
| field_traditional_chinese_uses | formatted_long | 1 |
| field_native_american_uses | formatted_long | 1 |
| field_cultural_significance | formatted_long | 1 |
| field_ethnobotanical_notes | formatted_long | 1 |
| field_folklore | formatted_long | 1 |

**Metadata:**

| Field | Type | Cardinality |
|-------|------|-------------|
| field_peer_review_status | list_string | 1 |
| field_average_rating | decimal | 1 |
| field_review_count | integer | 1 |
| field_herb_images | image | Unlimited |

**Entity References:**

| Field | Target | Cardinality |
|-------|--------|-------------|
| field_conditions_treated | node/condition | Unlimited |
| field_related_species | node/herb | Unlimited |
| field_substitute_herbs | node/herb | Unlimited |
| field_similar_tcm_herbs | node/herb | Unlimited |
| field_similar_western_herbs | node/herb | Unlimited |
| field_formulas | node/formula | Unlimited |

**Paragraph Fields (19 types):**

| Field | Paragraph Type | Cardinality |
|-------|---------------|-------------|
| field_common_names | herb_common_name | Unlimited |
| field_active_constituents | active_constituent | Unlimited |
| field_clinical_studies | clinical_study | Unlimited |
| field_recommended_dosage | dosage_info | Unlimited |
| field_drug_interactions | drug_interaction | Unlimited |
| field_toxicity_info | toxicity_info | 1 |
| field_historical_texts | historical_text | Unlimited |
| field_preparation_methods | preparation_method | Unlimited |
| field_storage_requirements | storage_info | 1 |
| field_sourcing_info | sourcing_info | 1 |
| field_regulatory_status | regulatory_info | Unlimited |
| field_quality_standards | quality_standard | Unlimited |
| field_adulteration_risks | adulteration_info | Unlimited |
| field_safety_warnings | safety_warning | Unlimited |
| field_practitioner_notes | practitioner_note | Unlimited |
| field_case_studies | case_study | Unlimited |
| field_alternative_ids | external_id | Unlimited |
| field_contributors | contributor | Unlimited |
| field_references | reference | Unlimited |

**Taxonomy References:**

| Field | Vocabulary | Cardinality |
|-------|-----------|-------------|
| field_search_tags | herb_tags | Unlimited |
| field_tcm_category_tags | tcm_categories | Unlimited |

**Sync Tracking Fields:**

| Field | Type | Source |
|-------|------|--------|
| field_trefle_id | integer | Trefle.io |
| field_perenual_id | integer | Perenual |
| field_herb2_id | integer | HERB 2.0 |
| field_pubchem_cid | integer | PubChem |
| field_smiles | text_long | Chemical |
| field_molecular_weight | float | Chemical |
| field_herb_source_dbs | text (unlimited) | Various |
| field_herb_latin_name | text | TCM |
| field_herb_pinyin_name | text | TCM |

#### 2. Modality (`node--modality`)

| Field | Type | Cardinality |
|-------|------|-------------|
| field_excels_at | text | Unlimited |
| field_benefits | text_long | 1 |
| field_description | text_long | 1 |
| field_conditions | entity_reference → condition | Unlimited |

#### 3. Condition (`node--condition`)

| Field | Type | Cardinality |
|-------|------|-------------|
| field_symptoms | text | Unlimited |
| field_severity | list_string | 1 |
| field_condition_description | text_long | 1 |

#### 4. Practitioner (`node--practitioner`)

| Field | Type | Cardinality |
|-------|------|-------------|
| field_practice_type | list_string | 1 |
| field_bio | text_long | 1 |
| field_address | text_long | 1 |
| field_latitude | decimal | 1 |
| field_longitude | decimal | 1 |
| field_modalities | entity_reference → modality | Unlimited |

Geocoding via OpenStreetMap Nominatim (holistic_hub module).

#### 5. Formula (`node--formula`)

| Field | Type | Cardinality |
|-------|------|-------------|
| field_description | text_long | 1 |
| field_total_weight | decimal(2) | 1 |
| field_total_weight_unit | list_string | 1 |
| field_preparation_instructions | text_long | 1 |
| field_dosage | text_long | 1 |
| field_use_cases | text | Unlimited |
| field_herb_ingredients | paragraph/herb_ingredient | Unlimited |
| field_conditions | entity_reference → condition | Unlimited |

**Paragraph: herb_ingredient** — field_herb (→ herb, required), field_quantity (decimal, required), field_unit (list: g/mg/oz/ml/tsp/tbsp/drops/parts, required), field_percentage (decimal 0-100), field_role (list: chief/deputy/assistant/envoy).

### Phase 2: TCM Enhancement Content Types

#### 6. TCM Ingredient (`node--tcm_ingredient`)

| Field | Type | Cardinality |
|-------|------|-------------|
| field_ingredient_id | integer | 1 |
| field_pubchem_cid | integer | 1 |
| field_cas_number | text | 1 |
| field_smiles | text_long | 1 |
| field_molecular_weight | float | 1 |
| field_source_db | text | 1 |
| field_herb_sources | entity_reference → herb | Unlimited |

#### 7. TCM Target Interaction (`node--tcm_target_interaction`)

| Field | Type | Cardinality |
|-------|------|-------------|
| field_target_name | text | 1 |
| field_uniprot_id | text | 1 |
| field_gene_name | text | 1 |
| field_score | float | 1 |
| field_evidence_type | text | Unlimited |
| field_source_db | text | 1 |
| field_ingredient_ref | entity_reference → tcm_ingredient | 1 |
| field_herb_ref | entity_reference → herb | 1 |

#### 8. TCM Clinical Evidence (`node--tcm_clinical_evidence`)

| Field | Type | Cardinality |
|-------|------|-------------|
| field_evidence_id | text | 1 |
| field_study_type | text | Unlimited |
| field_summary | text_long | 1 |
| field_outcome | text_long | 1 |
| field_source_url | link | 1 |
| field_source_db | text | 1 |
| field_herb_refs | entity_reference → herb | Unlimited |
| field_formula_ref | entity_reference → formula | 1 |

#### 9. Import Log (`node--import_log`)

| Field | Type | Cardinality |
|-------|------|-------------|
| field_source_db | text | 1 |
| field_records_processed | integer | 1 |
| field_records_created | integer | 1 |
| field_records_updated | integer | 1 |
| field_records_skipped | integer | 1 |
| field_errors | text_long | 1 |
| field_duration_seconds | float | 1 |

### Taxonomy Vocabularies

**herb_tags** (hierarchical): By Action, By Condition, By Tradition, By Part Used, By Form.

**tcm_categories** (hierarchical): Releasing the Exterior, Clearing Heat, Draining Downward, Transforming Dampness/Phlegm, Regulating Qi/Blood, Tonifying, Calming Spirit, etc.

### Entity Relationship Map

```
HERB ──┬── Conditions Treated → CONDITION
       ├── Related Species → HERB (self-ref)
       ├── Substitute Herbs → HERB (self-ref)
       ├── Similar TCM/Western Herbs → HERB (self-ref)
       ├── Formulas → FORMULA
       ├── 19 Paragraph types (sub-entities)
       └── Taxonomy: herb_tags, tcm_categories

FORMULA ─┬── Herb Ingredients (paragraph) → HERB
         └── Conditions → CONDITION

MODALITY ─── Conditions → CONDITION

PRACTITIONER ── Modalities → MODALITY

TCM_INGREDIENT ── Herb Sources → HERB

TCM_TARGET_INTERACTION ─┬── Ingredient → TCM_INGREDIENT
                        └── Herb → HERB

TCM_CLINICAL_EVIDENCE ─┬── Herbs → HERB
                       └── Formula → FORMULA
```

---

## Custom Modules Inventory

### 1. cloudflare_media_offload

**Purpose:** Cloudflare Images integration for media storage and delivery.

**Complexity:** Medium-High

| Aspect | Details |
|--------|---------|
| External API | Cloudflare Images API (`api.cloudflare.com/client/v4`) |
| Stream wrapper | Custom `cloudflare://` URI scheme |
| Queue workers | `cloudflare_media_offload_queue` (upload/delete) |
| Batch ops | Bulk migration of existing media |
| Routes | Settings, bulk upload, variants, migration, status dashboard, webhook |
| Hooks | entity_presave, file_url_alter, image_style_url_alter, image_style_deliver, etc. |
| DB table | `cloudflare_media_offload_log` |

**Migration path:** Directus custom storage adapter for Cloudflare, or Node.js worker for upload/transformation.

### 2. holistic_hub

**Purpose:** Geocoding for practitioner/clinic addresses.

**Complexity:** Low

| Aspect | Details |
|--------|---------|
| External API | OpenStreetMap Nominatim |
| Queue workers | `holistic_hub_geocode` |
| Hooks | entity_presave (queues geocoding) |

**Migration path:** Directus Flow triggered on practitioner create/update.

### 3. perenual_sync

**Purpose:** Secondary botanical data source (Perenual.com API).

**Complexity:** Medium

| Aspect | Details |
|--------|---------|
| External API | Perenual.com Plant API |
| Rate limiting | State-based request tracking |
| Routes | Settings, search, import, enrich |
| Services | Rate limiter, field mapper, image handler, main sync service |

**Migration path:** Standalone Node.js service or Directus extension.

### 4. trefle_sync

**Purpose:** Primary botanical data source (Trefle.io API).

**Complexity:** Medium-High

| Aspect | Details |
|--------|---------|
| External API | Trefle.io API |
| Rate limiting | Token bucket algorithm |
| Cron | Automatic paginated sync on every cron run |
| Queue workers | `trefle_sync_import` |
| Services | Rate limiter, field mapper, image handler, main sync service |

**Migration path:** Standalone Node.js service with scheduler (critical — primary data source).

### 5. verscienta_oidc_discovery

**Purpose:** OIDC provider endpoint for cross-domain SSO.

**Complexity:** Low (but architecturally significant)

| Aspect | Details |
|--------|---------|
| Routes | `/.well-known/openid-configuration`, `/oauth/logout` |
| Hooks | `hook_simple_oauth_oidc_claims_alter` (adds roles to claims) |
| Depends on | simple_oauth module |

**Migration path:** Directus built-in OAuth or dedicated auth service (Keycloak/Auth0).

---

## Frontend Inventory

### API Routes (23 total)

**Authentication (6):**
- `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- `/api/auth/register`, `/api/auth/profile`, `/api/auth/verify-email`

**AI / Grok (4):**
- `/api/grok/symptom-analysis` — core symptom checker
- `/api/grok/follow-ups`
- `/api/grok/herb-drug-check`
- `/api/grok/explain-formula`

**Content (11):**
- `/api/formulas`, `/api/formulas/[id]/{similar,network,contributions,family}`
- `/api/concepts`, `/api/concepts/[id]`
- `/api/patterns`, `/api/patterns/[id]`
- `/api/points`, `/api/points/[id]`
- `/api/herbs/[id]/targets`

**Other (2):**
- `/api/reviews`, `/api/knowledge-graph`, `/api/bookings`
- `/api/symbolic-compute`, `/api/symbolic-feedback`

All routes include CSRF validation, rate limiting, and Zod schema validation.

### Pages (App Router)

**Static:** `/about`, `/contact`, `/faq`, `/privacy`, `/terms`
**Auth:** `/login`, `/register`, `/forgot-password`, `/reset-password`, `/profile`, `/verify-email`
**Tools:** `/symptom-checker`, `/tools/herb-drug-interactions`
**Content (with `[id]` dynamic routes):** `/herbs`, `/formulas`, `/patterns`, `/points`, `/concepts`, `/conditions`, `/modalities`, `/practitioners`, `/clinics`
**Admin:** `/admin`, `/admin/knowledge-graph`
**User:** `/favorites`, `/search`

### Interactive Components (require `client:load` in Astro)

| Component | Reason |
|-----------|--------|
| SymptomChecker | Form + AI API call + loading states |
| Header / Navigation | Sticky, mobile menu, scroll detection, dropdowns |
| SearchBar / HeroSearch | Autocomplete, Algolia integration |
| DoseCalculator | SymPy API + interactive math |
| MolecularTargets | Data visualization |
| ClinicMap / ClinicMapInner | Leaflet map |
| KnowledgeGraph | React-Force-Graph-2D |
| FormulaNetwork / SimilarFormulas | Graph visualization |
| JiaJianSection / ContributionForm | User input forms |
| TongueAndPulsePanel | Interactive diagnosis tool |
| ExplainToPatientButton | API call on click |
| DarkModeToggle | Theme state |
| UserMenu / TurnstileWidget | Auth dropdown, CAPTCHA |
| Modal, Toast, FilterPanel | UI interactivity |

### Third-Party Integrations

| Service | Usage | Migration Impact |
|---------|-------|-----------------|
| xAI/Grok | Symptom analysis, formula explanation, herb-drug checks | Port to Astro API routes |
| Algolia | 6 search indices, React InstantSearch | Keep or replace with MeiliSearch |
| Cloudflare Turnstile | Bot protection on forms | Port server-side verification |
| Leaflet / React-Leaflet | Clinic/practitioner maps | Keep as React island |
| React-Force-Graph-2D | Knowledge graph visualization | Keep as React island |
| KaTeX | Math equation rendering | Works with Astro (static) |

### Design System

- **Tokens:** Style Dictionary (`design-tokens/tokens/`)
- **Colors:** Earth tones, sage green, gold — light/dark themes
- **Fonts:** Crimson Pro (serif), Source Sans 3 (sans), JetBrains Mono (mono), Noto Serif SC (Chinese)
- **CSS:** Tailwind v4 with CSS variables
- **Theme toggle:** `localStorage` key `verscienta_theme`

### Test Coverage

- **Unit (Jest):** 50+ tests — API routes, components, hooks, libraries
- **E2E (Playwright):** 5 test files — auth, detail pages, homepage, search, symptom checker
- **E2E tests are framework-agnostic** and can be reused if routes match

### Security Middleware

- CSP with per-request nonces
- HSTS, X-Frame-Options, X-Content-Type-Options
- Permissions-Policy (disables camera, mic, geolocation)
- CSRF token generation per session
- Request ID tracking

---

## Infrastructure Inventory

### Docker Services (Production)

| Service | Image | Port | Memory | Network | Health Check |
|---------|-------|------|--------|---------|--------------|
| nginx | nginx:1.27-alpine | 80, 443 | 128M | edge | None |
| frontend | ghcr.io/.../verscienta-frontend | 3000 | 512M | edge | wget /health |
| drupal | ghcr.io/.../verscienta-backend | 80 | 1G | edge + internal | curl /jsonapi |
| db | mariadb:11 | 3306 | 512M | internal | healthcheck.sh |
| redis | redis:7-alpine | 6379 | 256M | internal | None |
| dragonfly | dragonflydb/dragonfly | 6379 | 256M | internal | None |
| sympy-compute | ghcr.io/.../verscienta-sympy | 8000 | 512M | internal | HTTP /health |

### CI/CD (GitHub Actions)

- **deploy-backend.yml:** Build drupal + sympy images → push to GHCR → webhook to Coolify
- **deploy-frontend.yml:** Lint + typecheck + test → build image → push to GHCR → webhook to Coolify
- **test.yml:** Unit tests + Playwright E2E on PR and push to main

### Nginx Routing

| Domain | Upstream | Cache |
|--------|----------|-------|
| verscienta.com | frontend:3000 | /_next/static: 1yr, /images: 1d |
| api.verscienta.com | drupal:80 | /sites/default/files: 1h |

### Backup Strategy

- Daily gzip SQL dumps via `scripts/backup.sh`
- Weekly tar.gz of files + private directories
- Optional S3 upload (STANDARD_IA)
- 14-day local retention

---

## Gap Analysis

### What the Migration Guide Covers Well

- Core content types (herbs, formulas, modalities, conditions, practitioners)
- Directus as JSON:API replacement
- Astro 6 for static content pages
- Redis caching
- Docker-based development
- General migration phases and timeline

### Critical Gaps

| # | Gap | Severity | Effort |
|---|-----|----------|--------|
| 1 | **SymPy compute service not mentioned** — FastAPI microservice with DragonflyDB cache, `/compute` and `/dosage` endpoints | High | Low (keep as-is) |
| 2 | **xAI/Grok AI integration not mentioned** — 4 server-side API routes for symptom analysis, herb-drug checks, formula explanations | High | Medium |
| 3 | **23 custom API routes underestimated** — each with CSRF, rate limiting, Zod validation | High | High (2+ weeks) |
| 4 | **Algolia search not mentioned** — 6 indices, React InstantSearch, faceted search | Medium | Medium |
| 5 | **OIDC provider role oversimplified** — Drupal acts as OAuth provider for cross-domain SSO (erp, cms subdomains); Directus primarily acts as consumer, not provider | High | High |
| 6 | **Cloudflare media offload not mentioned** — custom `cloudflare://` stream wrapper, queue workers, batch migration, webhook | Medium | Medium |
| 7 | **Trefle/Perenual sync services underestimated** — cron-driven pagination, token bucket rate limiting, queue workers, field mapping | Medium | High |
| 8 | **4 additional content types not inventoried** — tcm_ingredient, tcm_target_interaction, tcm_clinical_evidence, import_log | High | Medium |
| 9 | **19 paragraph types are a major modeling challenge** — no direct Directus equivalent; each needs to become a related collection, JSON field, or repeater | High | High |
| 10 | **Security middleware not addressed** — CSP nonces, HSTS, CSRF, request tracking; Astro lacks Next.js-style middleware | Medium | Medium |
| 11 | **CI/CD pipelines not mentioned** — 3 GitHub Actions workflows need rewriting | Low | Medium |
| 12 | **Cloudflare Turnstile not mentioned** — CAPTCHA on registration/contact forms | Low | Low |

### Revised Timeline

The guide estimates 4-8 weeks. Accounting for gaps:

| Phase | Scope | Estimate |
|-------|-------|----------|
| Backend (Directus + data model + sync services) | 9 content types, 19 paragraph types, Trefle/Perenual services | 3-4 weeks |
| Frontend (Astro + API routes + AI + auth) | 23 API routes, Grok integration, 25+ interactive components | 3-4 weeks |
| Infrastructure (CI/CD, Cloudflare, security, OIDC) | GitHub Actions, nginx, middleware, auth strategy | 1-2 weeks |
| Testing and cutover | Regression, incremental sync, DNS switch | 1-2 weeks |
| **Total** | | **8-12 weeks** |

---

## Recommendations

1. **Keep SymPy as-is** — it is service-agnostic; only update calling code in the new frontend
2. **Decide OIDC strategy first** — if `erp.verscienta.com` or `cms.verscienta.com` depend on Drupal as identity provider, consider a dedicated auth service (Keycloak, Auth0) rather than Directus
3. **Prototype paragraph-to-Directus mapping** before committing to Approach A — the 19 paragraph types are the riskiest part of the data model
4. **Keep Algolia** — Directus built-in search will not match the current faceted search experience
5. **Port API routes incrementally** — start with read-only content, then auth, then AI routes
6. **Keep Cloudflare Turnstile** — minimal effort to port server-side verification to Astro
7. **Build Trefle/Perenual as standalone Node.js services** — decouple from CMS entirely for easier maintenance
