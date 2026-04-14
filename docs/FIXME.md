# FIXME — Audit of TODO.md items marked `[x]` (done)

**Audit date:** 2026-04-04  
**Scope:** Cross-checked implementations in the repo against completed items in `TODO.md`. This file lists **gaps**, **risks**, and **improvement suggestions** only; it does not re-list features that appear solid.

---

## Summary

Several areas are marked complete in `TODO.md` but are **stubbed**, **client-only**, **missing backend routes**, or **unsafe for production** without extra work. Prioritize the **Critical** section before treating the platform as production-ready.

---

## Critical — “Done” in docs but incomplete or broken in code

### Contact page (`TODO.md` §2 — contact form)

- **Finding:** `frontend/app/contact/page.tsx` simulates submission (`setTimeout` + `console.log`) with comments stating a real API is not wired.
- **Suggestions:**
  - Add `POST /api/contact` (or Webform/Drupal endpoint) with Zod validation, CSRF, rate limiting, and Turnstile when configured.
  - Remove simulated success paths from production builds or gate behind `NODE_ENV === 'development'`.

### Newsletter signup (`TODO.md` §3 — NewsletterSignup)

- **Finding:** `NewsletterSignup` calls `fetch('/api/newsletter/subscribe')`, but **no route exists** under `frontend/app/api/` (verified 2026-04-04).
- **Suggestions:**
  - Implement `app/api/newsletter/subscribe/route.ts` using `newsletterSchema` from `lib/validation.ts`, CSRF + rate limit, and a real provider (Drupal webform, Mailchimp, Brevo, etc.).
  - Or change the component to a no-op / mailto / external URL until the API exists, so users do not see false “Subscribed!” states.

### Login — social OAuth placeholders (`TODO.md` §2.1)

- **Finding:** Google and GitHub buttons in `frontend/app/login/page.tsx` have **no `onClick` / OAuth flow**; they are non-functional UI.
- **Suggestions:**
  - Remove the “Or continue with” block until OAuth is implemented, **or** wire Drupal OAuth social login **or** NextAuth with providers.
  - If kept as future work, add `aria-disabled` / tooltip / banner: “Coming soon” to match accessibility expectations.

### `/admin` dashboard (`TODO.md` §11.4)

- **Finding:** `frontend/app/admin/page.tsx` loads content counts from public Drupal JSON:API from the browser. There is **no Next.js or Drupal session check** on these routes—anyone with the URL can view stats and links.
- **Suggestions:**
  - Protect `/admin` and `/admin/knowledge-graph` with middleware: require valid session cookie / role (or move stats behind server-only API with auth).
  - If the dashboard is intentionally public, document that explicitly and avoid exposing non-public metadata.

---

## High — Behavioral gaps vs. stated “complete” features

### Language switcher (`TODO.md` §3.1, §6)

- **Finding:** `frontend/components/ui/LanguageSwitcher.tsx` persists `verscienta_lang` in `localStorage` but **does not change locale or load translations** (code comment acknowledges this). UI strings remain English.
- **Suggestions:**
  - Integrate `next-i18next` / App Router `next-intl` (or similar) and sync with `LanguageSwitcher`.
  - Until then, downgrade `TODO.md` claims or label the control “Display preference (coming soon)”.

### User favorites (`TODO.md` §2.4)

- **Finding:** `useFavorites` uses **localStorage only**—no Drupal user entity sync, no cross-device restore after login.
- **Suggestions:**
  - Add server-backed favorites (custom user field or flag entity) for logged-in users; merge local → server on login.
  - Document “local-only bookmarks” in UI for anonymous users.

### “Remember me” on login (`TODO.md` §2.1)

- **Finding:** Checkbox state is never sent to `/api/auth/login`; `loginSchema` only includes `username` and `password`. Cookie `maxAge` is always token defaults.
- **Suggestions:**
  - Extend schema + route to pass `rememberMe` and set longer `access_token` / `refresh_token` cookie lifetimes when true (aligned with Drupal token TTL).

### Algolia indexing script (`TODO.md` §4.1)

- **Finding:** `frontend/scripts/index-algolia.ts` fetches JSON:API with `page[limit]=100` and does not paginate through all pages for large corpora.
- **Suggestions:**
  - Follow `links.next` (JSON:API pagination) until exhausted for each content type.
  - Add idempotent partial reindex and error reporting for failed batches.

### Rate limiting (`TODO.md` §5.1)

- **Finding:** `lib/rate-limit.ts` uses an **in-memory `Map`**. This does not coordinate across multiple Node instances or serverless replicas; `getClientIdentifier` can fall back to `'unknown'`, collapsing many clients into one bucket.
- **Suggestions:**
  - Use Redis / Upstash / Cloudflare Rate Limiting in production.
  - Ensure reverse proxy sets `x-forwarded-for` / `x-real-ip` correctly; treat missing IP as strict rate limit or reject for state-changing routes.

### `TODO.md` internal consistency

- **Finding:** Same document claims OAuth “working” in “Working Now” while §1.5 and §4.4 list OAuth tasks unchecked; §5.1 says “all 7 routes” while many more API routes now use rate limits.
- **Suggestions:**
  - Reconcile sections or split “environment setup checklist” vs “code complete” to avoid onboarding confusion.

---

## Medium — Hardening and polish for verified features

### Security middleware (`middleware.ts`)

- **CSP:** Development uses `'unsafe-inline' 'unsafe-eval'` for scripts; ensure production path is what ships and test third-party embeds (Algolia, Leaflet, Turnstile) against the production CSP.
- **Suggestion:** Add CSP violation reporting (`report-uri` / `report-to`) in staging.

### Grok / symptom analysis (`app/api/grok/*`, `lib/grok.ts`)

- **Finding:** Symptom route logs structured metadata; ensure no raw user text is logged at `info` level in production.
- **Suggestions:**
  - Structured logging with PII redaction; metric hooks instead of `console.log` for “completed” events.
  - Centralize `503` when `XAI_API_KEY` missing—already present; add health check for operators.

### CSRF + client `fetch`

- **Suggestion:** Audit that **all** browser `fetch` calls to mutating API routes send the CSRF header/cookie pattern expected by `validateCsrfToken` (login/register forms may need documented helper).

### Accessibility (`TODO.md` §3.3)

- **Finding:** Automated coverage exists (e.g. `__tests__/a11y/color-contrast.test.ts` per TODO); full WCAG compliance still requires manual testing (screen readers, real keyboards).
- **Suggestions:**
  - Add `@axe-core/playwright` on critical flows in CI.
  - Social login buttons (when disabled) should not look like primary actions.

### Testing

- **Suggestion:** E2E “authentication flow” may depend on Drupal + env; document required test credentials and mock strategy so CI is deterministic.

### Backend / DevOps (scripts referenced as done)

- **Suggestion:** Where `TODO.md` claims backup/security scripts, add a single `docs/OPERATIONS.md` with how often backups run and restore drill results—code presence ≠ verified ops.

---

## Lower priority — Nice-to-have improvements

### PWA (`TODO.md` §11.2)

- Manifest exists (`frontend/public/manifest.json`); service worker / offline remain unchecked in `TODO.md`—align user-facing “Install app” messaging with actual capabilities.

### Dark mode (`TODO.md` §11.1)

- **Suggestion:** Flash-of-wrong-theme: ensure theme script runs before paint (inline in `layout` or `next-themes` pattern) if not already.

### SymPy service (`TODO.md` §4.5)

- **Suggestion:** Wire CI to run `pytest` in `services/sympy-compute/` and document Docker Compose smoke test so “deploy and test” is repeatable.

### Content / data pipeline (`TODO.md` §10.2)

- Scripts are marked done; production ingest still depends on downloading upstream datasets—track checksums and versioning in `DATA_SOURCES.md`.

---

## How to use this file

1. Fix **Critical** items before marketing features as complete.  
2. Update `TODO.md` checkboxes/wording where this audit shows drift.  
3. Treat **FIXME.md** as a living backlog; trim items when resolved.
