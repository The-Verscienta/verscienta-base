# Verscienta Health - Implementation Timeline

## Project Overview

**Verscienta Health** is a holistic health platform featuring:
- **Backend**: Drupal 11.x (headless CMS) + PostgreSQL 17.5
- **Frontend**: Next.js 15.3.4 with next-drupal toolkit
- **AI Integration**: Grok AI via xAI API
- **Core Features**: Health modality database, herbs, symptom checker with AI-guided diagnosis, treatment recommendations
- **Deployment**: Nixpacks (frontend), Docker (backend)

---

## Phase 1: Project Setup & Architecture (Weeks 1-2)

### Week 1: Foundation & Backend Setup

#### 1.1 Project Structure Initialization
- [ ] Create `/backend` folder for Drupal site
- [ ] Create `/frontend` folder for Next.js app
- [ ] Initialize Git repository with proper .gitignore
- [ ] Set up development environment documentation

#### 1.2 Backend Setup (Drupal 11.x)

**Installation & Configuration:**
- [ ] Install Drupal via Composer: `composer create-project drupal/recommended-project backend`
- [ ] Set up Docker for PostgreSQL 17.5
- [ ] Configure PostgreSQL in `sites/default/settings.php`
  - Database: `verscienta_health`
  - Driver: `pgsql`
- [ ] Enable core modules:
  - JSON:API
  - REST
  - Serialization
  - Content Translation
  - Locale

**Contrib Modules Installation:**
- [ ] `composer require drupal/search_api drupal/webform drupal/pathauto drupal/metatag drupal/simple_oauth drupal/json_field`

**Content Types Definition:**
- [ ] Create **Herbs** content type:
  - `field_scientific_name` (text)
  - `field_common_names` (field_collection)
  - `field_therapeutic_uses` (json)
  - `field_contraindications` (json)

- [ ] Create **Modalities** content type:
  - `field_name` (text)
  - `field_excels_at` (field_collection)
  - `field_benefits` (json)

- [ ] Create **Conditions** content type
- [ ] Create **Practitioners** content type with `field_practice_type`
- [ ] Create **Symptoms** content type
- [ ] Create **Reviews** content type with moderation
- [ ] Create **GrokInsights** content type with `field_analysis` (json)

**Entity References & Junctions:**
- [ ] Create Entity Reference fields for relationships:
  - Modality ↔ Conditions (`field_efficacy_level`: select)
  - Modality ↔ Practitioners

**Taxonomies:**
- [ ] Create "Herb Family" vocabulary
- [ ] Create "Modality Category" vocabulary

### Week 2: Frontend Setup & Security

#### 1.3 Frontend Setup (Next.js)

**Initialization:**
- [ ] Run: `npx create-next-app@15.3.4 frontend --typescript`
- [ ] Configure Tailwind CSS 4.1.0
- [ ] Set up project structure (components, pages, lib, types)

**Dependencies Installation:**
```bash
npm install next-drupal@latest tailwindcss@4.1.0 @radix-ui/react-dialog@1.4.3
@radix-ui/react-select@1.4.3 next-auth@latest @cloudflare/turnstile@latest
next-i18next@latest fuse.js@latest socket.io-client@latest zod@latest
```

**TypeScript Setup:**
- [ ] Define interfaces for Drupal entities:
  - `DrupalNode`
  - `HerbEntity`
  - `ModalityEntity`
  - `ConditionEntity`
  - `PractitionerEntity`

#### 1.4 Grok AI Setup
- [ ] Obtain xAI API key from `https://x.ai/api`
- [ ] Create `.env` file with `XAI_API_KEY`
- [ ] Set up `node-fetch` for API calls
- [ ] Configure Redis for caching (local development)

#### 1.5 Security Architecture

**Drupal Security:**
- [ ] Configure roles: Admin, Editor, Practitioner, User
- [ ] Set up Simple OAuth for bearer token authentication
- [ ] Configure JSON:API permissions per role
- [ ] Add field validation constraints (max length, required)
- [ ] Create database indexes on `name`, `excels_at`
- [ ] Install and configure Conditional Fields module
- [ ] Set max depth for JSON:API include parameters

**Frontend Security:**
- [ ] Configure NextAuth.js with JWT
- [ ] Integrate NextAuth with Drupal OAuth
- [ ] Set up Zod schemas for input validation
- [ ] Configure Cloudflare Turnstile
- [ ] Implement rate limiting for API routes

**Backend Additional Setup:**
- [ ] Create REST-enabled Views for API endpoints
  - `/jsonapi/node/herb`
  - `/jsonapi/node/modality`
  - `/jsonapi/views/recent_content`
- [ ] Configure internationalization (English, Spanish, Chinese)
- [ ] Set up multi-site if needed

---

## Phase 2: Implementation (Weeks 3-6)

### Week 3: Backend Development

#### 2.1 Custom Module Development

**Create Custom Module (`holistic_hub`):**
- [ ] Generate module structure
- [ ] Implement `hook_entity_presave()` for geocoding
  - Integrate OpenStreetMap Nominatim API
  - Geocode practitioner addresses on save

**Caching Implementation:**
- [ ] Configure Redis module for Drupal
- [ ] Set up caching for:
  - API responses
  - View results
  - Entity queries

**File Storage:**
- [ ] Configure Drupal Filesystem for images
- [ ] Set up image styles for different sizes
- [ ] Optional: Configure CDN module

**Webform Configuration:**
- [ ] Create symptom checker webform
- [ ] Create review submission webform
- [ ] Configure webform handlers for processing

### Week 4: Frontend Development (Core Pages)

#### 2.2 Frontend Pages & Components

**Create Core Pages:**
- [ ] Home page (`app/page.tsx`)
  - Hero section
  - Featured modalities
  - Search preview

- [ ] Search page (`app/search/page.tsx`)
  - Integrate Fuse.js for fuzzy search
  - Filter controls
  - Results grid

- [ ] Modality Detail page (`app/modality/[id]/page.tsx`)
  - Fetch from Drupal JSON:API
  - Display benefits, related conditions
  - Show related practitioners

- [ ] Herb Detail page (`app/herb/[id]/page.tsx`)
  - Scientific and common names
  - Therapeutic uses
  - Contraindications

**Create Shared Components:**
- [ ] Navigation component with i18n
- [ ] Footer component
- [ ] Card components (HerbCard, ModalityCard)
- [ ] Search bar component
- [ ] Language switcher

### Week 5: Advanced Features & AI Integration

#### 2.3 Symptom Checker Implementation

**Symptom Checker Page:**
- [ ] Create form UI (`app/symptom-checker/page.tsx`)
- [ ] Implement multi-step form flow
- [ ] Add Cloudflare Turnstile validation
- [ ] Create results display component

**Symptom Flow:**
1. [ ] User submits initial symptoms
2. [ ] POST to Drupal Webform endpoint
3. [ ] Call Grok AI for analysis
4. [ ] Display follow-up questions
5. [ ] Show recommendations with modality links

#### 2.4 Grok AI Integration

**Create API Routes:**
- [ ] `/api/grok/symptom-analysis/route.ts`
  - Accept symptom data
  - Call xAI API
  - Return analysis

- [ ] `/api/grok/follow-ups/route.ts`
  - Generate follow-up questions
  - Context-aware prompts

**AI Features:**
- [ ] Symptom analysis endpoint
- [ ] Content summarization for modalities
- [ ] Treatment recommendations
- [ ] Implement Redis caching with TTL
- [ ] Add anonymization layer for user data

### Week 6: Integration & Additional Features

#### 2.5 System Integration

**Next.js ↔ Drupal:**
- [ ] Create Drupal client library (`lib/drupal.ts`)
- [ ] Implement data fetching utilities
- [ ] Set up ISR (Incremental Static Regeneration)
- [ ] Configure preview mode for editors

**Real-Time Features:**
- [ ] Set up Socket.io server
- [ ] Implement Redis for pub/sub
- [ ] Add real-time notifications (if needed)

**PWA Setup:**
- [ ] Configure service workers
- [ ] Implement offline caching strategy
- [ ] Add manifest.json
- [ ] Cache critical resources

**Additional Pages:**
- [ ] Admin Dashboard (`app/admin/page.tsx`)
  - Link to Drupal admin
  - Quick stats display
- [ ] User profile pages
- [ ] Practitioner directory

---

## Phase 3: Testing, Optimization & Deployment (Weeks 7-8)

### Week 7: Testing & Optimization

#### 3.1 Testing Implementation

**Unit Tests:**
- [ ] Frontend component tests (Jest)
  - Test all major components
  - Test utility functions
  - Test custom hooks

- [ ] Backend tests (PHPUnit)
  - Test custom module functionality
  - Test hooks
  - Test API endpoints

**Integration Tests:**
- [ ] API endpoint tests (Supertest)
  - Test all Drupal JSON:API endpoints
  - Test custom API routes
  - Test Grok AI integration

**E2E Tests:**
- [ ] User flow tests (Playwright)
  - Homepage navigation
  - Search functionality
  - Symptom checker flow
  - Modality/herb detail views

**Accessibility Tests:**
- [ ] Run Axe-core audits
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Ensure WCAG 2.1 AA compliance

**Target:** 90%+ code coverage

#### 3.2 Optimization

**Drupal Optimization:**
- [ ] Enable internal page cache
- [ ] Enable dynamic page cache
- [ ] Configure views caching
- [ ] Add database indexes:
  - Content type fields (name, category)
  - Frequently queried fields
  - Entity reference fields

**Frontend Optimization:**
- [ ] Optimize images with Next.js Image component
- [ ] Implement code splitting
- [ ] Lazy load components
- [ ] Run Lighthouse audits and fix issues:
  - Performance score > 90
  - Accessibility score > 90
  - Best Practices score > 90
  - SEO score > 90

**Performance Targets:**
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Largest Contentful Paint < 2.5s

### Week 8: Deployment & Documentation

#### 3.3 Deployment Setup

**Frontend Deployment (Nixpacks v1.28.0):**
- [ ] Create `nixpacks.toml` configuration
- [ ] Set up environment variables
- [ ] Configure build settings
- [ ] Deploy to hosting platform (Railway, Render, or Vercel)
- [ ] Configure custom domain
- [ ] Set up SSL certificates

**Backend Deployment:**
- [ ] Create `docker-compose.yml` for Drupal + PostgreSQL
- [ ] Configure production settings.php
  - Database credentials
  - Trusted host patterns
  - File system paths
- [ ] Set up Docker volumes for persistent data
- [ ] Deploy to hosting platform (DigitalOcean, AWS, or Acquia)
- [ ] Configure reverse proxy (nginx)

**CI/CD Pipeline:**
- [ ] Create GitHub Actions workflows:
  - `.github/workflows/test.yml` - Run tests on PR
  - `.github/workflows/deploy-frontend.yml` - Deploy frontend
  - `.github/workflows/deploy-backend.yml` - Deploy backend
- [ ] Configure automated testing
- [ ] Set up deployment approvals

#### 3.4 Documentation & Maintenance

**Documentation:**
- [ ] Create README.md with setup instructions
- [ ] Document API endpoints
- [ ] Create developer guide
- [ ] Write content editor guide for Drupal admin
- [ ] Document deployment process

**Maintenance Setup:**
- [ ] Configure automated Drupal updates
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy:
  - Database backups (daily)
  - File system backups (weekly)
- [ ] Set up error logging and tracking
- [ ] Create incident response plan

**Training:**
- [ ] Train content editors on Drupal admin UI
- [ ] Create video tutorials for common tasks
- [ ] Set up support documentation

---

## Phase 4: Future Enhancements (Post-Launch)

### Future Roadmap

**Mobile Application:**
- [ ] React Native app development
- [ ] Share code with Next.js web app
- [ ] App store deployment

**Enhanced AI Features:**
- [ ] Conversational chatbot
- [ ] Personalized recommendations based on history
- [ ] AI-powered content generation for practitioners

**Community Features:**
- [ ] User forums
- [ ] Practitioner Q&A
- [ ] User-generated reviews and ratings

**Additional Content:**
- [ ] Expand herb database
- [ ] Add more modalities
- [ ] Video content integration
- [ ] Research article library

**Analytics & Insights:**
- [ ] User behavior analytics
- [ ] Popular modalities dashboard
- [ ] Search trends analysis

---

## Key Deliverables & Artifacts

### Code Artifacts to Implement

1. **Backend (Drupal)**
   - `backend/web/modules/custom/holistic_hub/holistic_hub.module` - Custom module with hooks
   - `backend/config/sync/node.type.herb.yml` - Herb content type configuration
   - `backend/config/sync/node.type.modality.yml` - Modality content type configuration
   - `backend/docker-compose.yml` - Docker deployment configuration

2. **Frontend (Next.js)**
   - `frontend/package.json` - Dependencies and scripts
   - `frontend/lib/drupal.ts` - Drupal client library
   - `frontend/types/drupal.ts` - TypeScript type definitions
   - `frontend/app/page.tsx` - Home page
   - `frontend/app/symptom-checker/page.tsx` - Symptom checker page
   - `frontend/app/api/grok/symptom-analysis/route.ts` - Grok API route
   - `frontend/nixpacks.toml` - Deployment configuration

3. **Infrastructure**
   - `.github/workflows/` - CI/CD workflows
   - `docker-compose.yml` - Full stack local development
   - `.env.example` - Environment variables template

---

## Timeline Summary

| Phase | Duration | Key Milestones |
|-------|----------|----------------|
| **Phase 1: Setup** | Weeks 1-2 | Drupal installed, content types created, Next.js scaffolded, Grok integration ready |
| **Phase 2: Implementation** | Weeks 3-6 | Custom modules complete, frontend pages built, AI integrated, PWA enabled |
| **Phase 3: Testing & Deployment** | Weeks 7-8 | 90%+ test coverage, performance optimized, deployed to production |
| **Phase 4: Future** | Post-launch | Mobile app, enhanced AI, community features |

**Total Initial Development Time:** 8 weeks

---

## Success Criteria

- [ ] All content types functioning in Drupal with proper relationships
- [ ] Frontend displays all data from Drupal JSON:API correctly
- [ ] Symptom checker provides AI-powered recommendations
- [ ] Multi-language support working (EN, ES, ZH)
- [ ] Responsive design on all devices
- [ ] WCAG 2.1 AA compliant
- [ ] Lighthouse scores > 90 across all metrics
- [ ] 90%+ test coverage
- [ ] Successful deployment to production
- [ ] Content editors trained and comfortable with Drupal admin

---

## Risk Mitigation

| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| xAI API rate limits | High | Implement Redis caching, queue system |
| Drupal-Next.js integration issues | High | Use proven next-drupal toolkit, early testing |
| Performance bottlenecks | Medium | Regular performance audits, optimization sprints |
| Security vulnerabilities | High | Regular security audits, dependency updates, penetration testing |
| Content migration complexity | Medium | Start with small dataset, iterative approach |

---

## Team & Resources

**Required Roles:**
- Full-stack developer (Drupal + Next.js)
- DevOps engineer (Docker, CI/CD)
- Content strategist (Drupal content modeling)
- QA engineer (Testing)
- UI/UX designer (Design system)

**External Services:**
- xAI API (Grok AI)
- Redis hosting
- PostgreSQL hosting
- Next.js hosting (Nixpacks compatible)
- Domain and SSL
- CDN (optional)

---

*Last Updated: 2025-09-29*