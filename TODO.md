# Verscienta Health - Comprehensive TODO List

**Last Updated:** 2026-02-16
**Overall Progress:** ~93% complete

---

## Summary

| Category | Progress | Notes |
| ---------- | ---------- | -------- |
| Frontend Pages | 100% | 26 pages built; all pages use DesignSystem consistently |
| Frontend Components | 95% | 30+ components (added Skeleton, ErrorBoundary, NewsletterSignup, enhanced Toast) |
| Frontend API Routes | 100% | 7 routes (auth, grok) |
| Backend Setup | 95% | Drupal running, all content types with fields, taxonomies, entity refs, sample data scripts |
| External Services | 40% | Algolia configured and indexed |
| Testing | 0% | No tests written |
| Deployment | 20% | Docker setup exists, CI/CD needed |
| Documentation | 70% | Good docs, needs API documentation |

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

### 1.4 Paragraph Types

- [ ] herb_common_name
- [ ] tcm_properties
- [ ] active_constituent
- [ ] clinical_study
- [ ] dosage_info
- [ ] drug_interaction
- [ ] toxicity_info
- [ ] preparation_method
- [ ] storage_info
- [ ] sourcing_info
- [ ] quality_standard
- [ ] adulteration_info
- [ ] safety_warning
- [ ] historical_text
- [ ] practitioner_note
- [ ] case_study
- [ ] regulatory_info
- [ ] external_id
- [ ] contributor
- [ ] reference
- [ ] image_info

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

- [ ] Email verification flow
- [ ] User favorites/bookmarks system
- [ ] User reviews submission
- [ ] Practitioner booking request

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
- [ ] LanguageSwitcher component
- [ ] DarkModeToggle component
- [ ] Navigation component (separate from header)

### 3.2 Feature Enhancements

- [x] Toast notifications integration (global provider in layout)
- [x] Loading skeletons for better UX
- [x] Error boundaries for graceful error handling
- [x] Newsletter signup component
- [x] Turbopack enabled for faster dev builds
- [ ] Image optimization (WebP, lazy loading)
- [x] Server-side pagination for listings (ServerPagination component)
- [x] Sort functionality for listings (SortDropdown component)
- [ ] Advanced filtering (faceted search)

### 3.3 Accessibility

- [ ] Screen reader testing
- [ ] Keyboard navigation audit
- [ ] Color contrast verification
- [ ] WCAG 2.1 AA compliance check
- [ ] aria-labels where needed
- [ ] Focus management

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

### 4.2 Grok AI (xAI)

- [ ] Obtain xAI API key
- [ ] Add to .env (XAI_API_KEY)
- [ ] Test symptom analysis endpoint
- [ ] Configure rate limiting
- [ ] Set up Redis caching for responses

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
- [ ] CSRF protection implementation
- [x] Secure HTTP headers (next.config.ts)
- [x] Content Security Policy (added to next.config.ts)
- [ ] Input sanitization

### 5.2 Backend Security
- [ ] Configure trusted host patterns
- [ ] Set up secure file permissions
- [ ] Database backup strategy
- [ ] Audit module for logging
- [ ] Password policy configuration

---

## 6. INTERNATIONALIZATION (LOW PRIORITY)

### 6.1 i18n Setup
- [ ] Configure next-i18next
- [ ] Create translation files:
  - [ ] `public/locales/en/common.json`
  - [ ] `public/locales/es/common.json`
  - [ ] `public/locales/zh-CN/common.json`
  - [ ] `public/locales/zh-TW/common.json`
- [ ] Create LanguageSwitcher component
- [ ] Test language switching
- [ ] Enable Drupal content translation
- [ ] Sync translations between Drupal and Next.js

---

## 7. TESTING (MEDIUM PRIORITY)

### 7.1 Frontend Testing
- [ ] Set up Jest + React Testing Library
- [ ] Write component tests (15+ components)
- [ ] Write API route tests
- [ ] Write hook tests (useAuth, etc.)
- [ ] Set up Playwright for E2E tests
- [ ] Write E2E tests:
  - [ ] Homepage navigation
  - [ ] Search functionality
  - [ ] Authentication flow
  - [ ] Symptom checker flow
  - [ ] Herb/modality detail views

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
- [ ] Optimize images (WebP format)
- [ ] Implement code splitting
- [ ] Lazy load components
- [ ] Configure ISR (Incremental Static Regeneration)
- [ ] Add service worker for caching
- [ ] Optimize bundle size

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
- [ ] Create `.github/workflows/test.yml` - Run tests on PR
- [ ] Create `.github/workflows/lint.yml` - Run linting
- [ ] Create `.github/workflows/deploy-frontend.yml`
- [ ] Create `.github/workflows/deploy-backend.yml`
- [ ] Configure environment secrets in GitHub

### 9.2 Frontend Deployment
- [ ] Create nixpacks.toml (or Vercel config)
- [ ] Configure environment variables
- [ ] Set up custom domain
- [ ] Configure SSL
- [ ] Set up CDN

### 9.3 Backend Deployment
- [ ] Finalize docker-compose for production
- [ ] Configure production settings.php
- [ ] Set up database backups (daily)
- [ ] Configure file system backups (weekly)
- [ ] Set up monitoring (uptime, errors)
- [ ] Configure reverse proxy (nginx)

---

## 10. CONTENT POPULATION (AFTER BACKEND SETUP)

### 10.1 Initial Content
- [ ] Add 10-20 sample herbs with full data
- [ ] Add 10-15 modalities with descriptions
- [ ] Add 20-30 common conditions
- [ ] Add 5-10 sample practitioners
- [ ] Add 5-10 classical formulas
- [ ] Add sample reviews

### 10.2 Content Import
- [ ] Create CSV import templates
- [ ] Set up Feeds/Migrate module
- [ ] Import bulk herb data
- [ ] Import bulk modality data
- [ ] Verify data integrity

---

## 11. NICE-TO-HAVE FEATURES (LOW PRIORITY)

### 11.1 Dark Mode
- [ ] Implement CSS variables for dark theme
- [ ] Create DarkModeToggle component
- [ ] Persist preference (localStorage)
- [ ] Respect system preference

### 11.2 PWA Features
- [ ] Create manifest.json
- [ ] Configure service worker
- [ ] Implement offline caching
- [ ] Add install prompt

### 11.3 Real-Time Features
- [ ] Set up Socket.io (if needed)
- [ ] Live chat/chatbot
- [ ] Real-time notifications
- [ ] Online practitioner status

### 11.4 Admin Dashboard
- [ ] Create `/admin` page
- [ ] Quick stats display
- [ ] Link to Drupal admin
- [ ] Content overview

### 11.5 Advanced Features
- [ ] User reviews & ratings system
- [ ] Practitioner booking system
- [ ] E-commerce integration (herb sales)
- [ ] User forums/community
- [ ] Mobile app (React Native)

---

## PRIORITY ORDER FOR IMPLEMENTATION

### Phase 1: Foundation (Critical - Do First) ✅ MOSTLY COMPLETE
1. ✅ Complete Drupal setup (DDEV/WSL2)
2. ✅ Create content types
3. ✅ Configure OAuth
4. Configure external services (Algolia, Turnstile, xAI)
5. Test full auth flow

### Phase 2: Core Features (High Priority) ✅ MOSTLY COMPLETE
6. Populate sample content
7. ✅ Finish page design updates
8. ✅ Add missing components
9. Complete security features

### Phase 3: Polish (Medium Priority)
10. Write tests
11. Set up CI/CD
12. Performance optimization
13. Accessibility audit

### Phase 4: Enhancement (Low Priority)
14. i18n setup
15. Dark mode
16. PWA features
17. Additional content pages

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
