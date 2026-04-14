# Verscienta Health - Frontend Implementation Plan

Based on comprehensive analysis of project requirements, here's what needs to be added to the frontend.

---

## 🎯 Critical Missing Features (Must Have)

### 1. **Grok AI Integration** ⭐ PRIORITY 1
**Status:** Partially implemented (UI exists, API missing)

**What's Needed:**
- ✅ Symptom checker page UI (done)
- ❌ `/api/grok/symptom-analysis/route.ts` - AI analysis endpoint
- ❌ `/api/grok/follow-ups/route.ts` - Follow-up questions
- ❌ Redis caching for AI responses
- ❌ Data anonymization before sending to xAI

**Implementation:**
```
app/api/grok/
├── symptom-analysis/route.ts
└── follow-ups/route.ts
```

**Why Critical:** Core feature - the main differentiator of the platform

---

### 2. **Individual Detail Pages** ⭐ PRIORITY 2
**Status:** Missing

**What's Needed:**
- ❌ `/herbs/[id]/page.tsx` - Single herb detail view
- ❌ `/modalities/[id]/page.tsx` - Single modality detail view
- ❌ `/conditions/[id]/page.tsx` - Condition detail page
- ❌ `/practitioners/[id]/page.tsx` - Practitioner profile

**Features per page:**
- Full details from Drupal JSON:API
- Related content (entity references)
- Reviews section
- Share functionality
- Breadcrumb navigation

**Why Critical:** Users need to see full details, not just listings

---

### 3. **Authentication UI** ⭐ PRIORITY 3
**Status:** Backend done, UI missing

**What's Needed:**
- ❌ User menu in header (login/logout, profile)
- ❌ Protected route middleware
- ❌ `/register` page
- ❌ `/profile` page
- ❌ Session management UI
- ❌ Password reset flow

**Implementation:**
```
components/
├── Header.tsx (with auth menu)
├── UserMenu.tsx
└── ProtectedRoute.tsx

app/
├── register/page.tsx
└── profile/page.tsx
```

**Why Critical:** Users can't log in without UI

---

### 4. **Practitioner Finder** ⭐ PRIORITY 4
**Status:** Missing

**What's Needed:**
- ❌ `/practitioners/page.tsx` - Practitioner directory
- ❌ Geolocation/map integration
- ❌ Filter by modality, distance, practice type
- ❌ Search by location/zip code
- ❌ Results with map markers

**Why Critical:** Key feature for connecting users with practitioners

---

### 5. **Search Functionality** ⭐ PRIORITY 5
**Status:** Page exists, needs implementation

**What's Needed:**
- ❌ Algolia integration for search
- ❌ Index Drupal content to Algolia (herbs, modalities, conditions, practitioners)
- ❌ InstantSearch UI components
- ❌ Filter controls (type, category, etc.)
- ❌ Results pagination
- ❌ Search suggestions/autocomplete
- ❌ Drupal hook to sync content to Algolia on create/update

**Why Critical:** Users need to find information quickly

---

## 🔧 Important Features (Should Have)

### 6. **TypeScript Type Definitions**
**Status:** Partial

**What's Needed:**
```typescript
types/
├── drupal.ts         // All Drupal entity types
├── grok.ts           // Grok AI request/response types
└── components.ts     // Component prop types
```

**Types to Define:**
- HerbEntity, ModalityEntity, ConditionEntity
- PractitionerEntity, SymptomEntity, ReviewEntity
- GrokInsightEntity
- API response types

---

### 7. **Reusable Components**
**Status:** Partial (some exist)

**Needed Components:**
```
components/
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Toast.tsx (for notifications)
│   └── Loading.tsx (spinner)
├── HerbCard.tsx ✅
├── ModalityCard.tsx ✅
├── ConditionCard.tsx
├── PractitionerCard.tsx
├── ReviewCard.tsx
├── SearchBar.tsx ✅
├── FilterPanel.tsx
├── Pagination.tsx
└── Breadcrumbs.tsx
```

---

### 8. **Navigation & Layout**
**Status:** Basic layout exists

**Improvements Needed:**
- Separate Navigation component
- Mobile responsive menu
- User authentication dropdown
- Active link highlighting
- Language switcher
- Dark mode toggle

**Implementation:**
```
components/
├── Navigation.tsx
├── MobileMenu.tsx
├── UserDropdown.tsx
└── LanguageSwitcher.tsx
```

---

### 9. **Security Features**
**Status:** Missing

**What's Needed:**
- ❌ Cloudflare Turnstile on forms
- ❌ Rate limiting middleware
- ❌ Input validation with Zod schemas
- ❌ CSRF protection
- ❌ Secure headers

**Implementation:**
```
lib/
├── validation.ts (Zod schemas)
├── rate-limit.ts
└── security.ts

middleware.ts (for protected routes)
```

---

### 10. **Internationalization (i18n)**
**Status:** Package installed, not configured

**What's Needed:**
- Configure next-i18next
- Translation files (en, es, zh-CN, zh-TW)
- Language switcher component
- Sync with Drupal translations

**Implementation:**
```
public/locales/
├── en/common.json
├── es/common.json
├── zh-CN/common.json
└── zh-TW/common.json

next-i18next.config.js
```

---

## 🎨 Nice-to-Have Features (Could Have)

### 11. **Dark Mode**
**Status:** Not implemented

**What's Needed:**
- Tailwind dark mode classes
- Theme toggle component
- Persist preference (localStorage)
- System preference detection

---

### 12. **PWA Features**
**Status:** Not implemented

**What's Needed:**
- Service worker setup
- Manifest.json
- Offline caching strategy
- Install prompt

---

### 13. **Real-Time Features**
**Status:** socket.io-client installed, not used

**Potential Uses:**
- Live chat/chatbot
- Real-time notifications
- Online practitioner status

---

### 14. **Admin Dashboard**
**Status:** Not implemented

**What's Needed:**
- Admin-only page
- Quick stats display
- Link to Drupal admin
- Content overview

---

### 15. **Additional Pages**
**Status:** Missing

**Needed Pages:**
- `/about` - About us
- `/contact` - Contact form
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/faq` - Frequently asked questions

---

## 📊 Implementation Priority Matrix

| Feature | Priority | Effort | Impact | Status |
|---------|----------|--------|--------|--------|
| Grok AI API Routes | P1 | High | High | 🔴 Missing |
| Detail Pages | P2 | Medium | High | 🔴 Missing |
| Auth UI | P3 | Medium | High | 🟡 Partial |
| Practitioner Finder | P4 | High | High | 🔴 Missing |
| Search Implementation | P5 | Medium | High | 🟡 Partial |
| Type Definitions | P6 | Low | Medium | 🟡 Partial |
| UI Components | P7 | Medium | Medium | 🟡 Partial |
| Security Features | P8 | Medium | High | 🔴 Missing |
| i18n Setup | P9 | Medium | Medium | 🔴 Missing |
| Dark Mode | P10 | Low | Low | 🔴 Missing |

---

## 🚀 Recommended Implementation Order

### **Phase 1: Core Functionality (Week 1-2)**
1. ✅ Basic pages (done)
2. **Grok AI API routes** - Critical for symptom checker
3. **Detail pages** - Essential for browsing
4. **Type definitions** - Foundation for everything else
5. **Auth UI** - Enable user login

### **Phase 2: Discovery & Search (Week 2-3)**
6. **Search implementation** - Help users find content
7. **Practitioner finder** - Connect users with help
8. **Pagination & filtering** - Better browsing
9. **UI component library** - Consistency

### **Phase 3: Polish & Security (Week 3-4)**
10. **Security features** - CAPTCHA, rate limiting
11. **Registration page** - User onboarding
12. **Navigation improvements** - Better UX
13. **Error handling** - Toast notifications
14. **Loading states** - Better feedback

### **Phase 4: Enhancement (Week 4+)**
15. **i18n** - Multi-language support
16. **Dark mode** - User preference
17. **PWA** - Offline support
18. **Admin dashboard** - Content management
19. **Additional pages** - About, Contact, etc.

---

## 📁 Recommended File Structure

```
frontend/
├── app/
│   ├── (auth)/                 # Auth group
│   │   ├── login/
│   │   ├── register/
│   │   └── profile/
│   ├── (public)/               # Public routes
│   │   ├── herbs/
│   │   │   ├── page.tsx ✅
│   │   │   └── [id]/page.tsx ❌
│   │   ├── modalities/
│   │   │   ├── page.tsx ✅
│   │   │   └── [id]/page.tsx ❌
│   │   ├── practitioners/
│   │   │   ├── page.tsx ❌
│   │   │   └── [id]/page.tsx ❌
│   │   ├── conditions/
│   │   │   └── [id]/page.tsx ❌
│   │   ├── search/ ✅
│   │   ├── symptom-checker/ ✅
│   │   ├── about/
│   │   ├── contact/
│   │   └── faq/
│   ├── api/
│   │   ├── auth/ ✅
│   │   ├── grok/
│   │   │   ├── symptom-analysis/ ❌
│   │   │   └── follow-ups/ ❌
│   │   └── search/ ❌
│   ├── admin/
│   │   └── page.tsx ❌
│   ├── layout.tsx ✅
│   └── page.tsx ✅
├── components/
│   ├── ui/                     # Radix UI wrappers
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   └── toast.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navigation.tsx
│   │   └── MobileMenu.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── UserMenu.tsx
│   ├── cards/
│   │   ├── HerbCard.tsx ✅
│   │   ├── ModalityCard.tsx ✅
│   │   ├── PractitionerCard.tsx
│   │   └── ConditionCard.tsx
│   ├── search/
│   │   ├── SearchBar.tsx ✅
│   │   ├── SearchResults.tsx
│   │   ├── FilterPanel.tsx
│   │   └── Pagination.tsx
│   └── symptom-checker/
│       ├── SymptomForm.tsx
│       ├── FollowUpQuestions.tsx
│       └── Results.tsx
├── lib/
│   ├── drupal.ts ✅
│   ├── auth.ts ✅
│   ├── grok.ts ❌
│   ├── search.ts ❌
│   ├── validation.ts ❌
│   ├── rate-limit.ts ❌
│   └── utils.ts
├── types/
│   ├── drupal.ts ❌
│   ├── grok.ts ❌
│   └── index.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useSearch.ts
│   └── useToast.ts
├── public/
│   ├── locales/ ❌
│   └── manifest.json ❌
├── styles/
│   └── globals.css ✅
├── middleware.ts ❌
└── next-i18next.config.js ❌
```

---

## 🔑 Key Missing Integrations

### 1. **Grok AI (xAI API)**
- Symptom analysis
- Follow-up question generation
- Content summarization
- Redis caching

### 2. **Cloudflare Turnstile**
- CAPTCHA on forms
- Bot protection

### 3. **Algolia**
- Real-time search
- Faceted filtering
- Autocomplete/instant results
- Typo tolerance
- Analytics

### 4. **Geolocation**
- Practitioner finder
- Map integration (Leaflet or Mapbox)

### 5. **Redis**
- API response caching
- Session storage
- Rate limiting

---

## 📝 Summary

**Currently Have:**
- ✅ Basic page structure
- ✅ Drupal client configured
- ✅ OAuth authentication (backend)
- ✅ Basic UI pages (home, herbs, modalities, symptom-checker, login)
- ✅ Some components (HerbCard, ModalityCard, SearchBar)

**Critical Missing:**
- ❌ Grok AI API integration (symptom analysis)
- ❌ Individual detail pages
- ❌ Auth UI in header
- ❌ Practitioner finder
- ❌ Search functionality
- ❌ Registration page
- ❌ Security features (CAPTCHA, rate limiting)
- ❌ TypeScript types
- ❌ i18n configuration

**Estimated Work:**
- **Critical features:** 3-4 weeks
- **Complete MVP:** 6-8 weeks
- **Full feature set:** 10-12 weeks

---

Would you like me to start implementing these features? I recommend beginning with:
1. **Grok AI API routes** (enables symptom checker)
2. **Detail pages** (complete browsing experience)
3. **Auth UI** (enable user interactions)
