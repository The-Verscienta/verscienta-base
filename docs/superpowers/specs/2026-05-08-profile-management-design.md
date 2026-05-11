# Profile Management — Design

**Date:** 2026-05-08
**Status:** Approved (pending user spec review)
**Branch:** `claude/compassionate-gauss-e4863f`

## Goal

Make `/profile` the canonical place for a signed-in user to manage their account. Move duplicated account UI off `/dashboard`, leaving the dashboard as a pure landing page.

## Scope

### In scope
- **Identity** — first name, last name, email
- **Password** — change password with current-password confirmation
- **Avatar** — upload/replace/remove profile photo
- **Preferred practitioner** — set/clear a preferred practitioner relationship
- **Email verification status** — show verified state; resend verification email if unverified
- **"Set as my practitioner" button** on `/practitioners/[id]` (otherwise users have no way to set one)
- **Dashboard cleanup** — remove duplicated account UI; add a link to `/profile`
- **Automated tests** — Vitest for endpoint logic + Playwright for user flows

### Deferred (explicit non-goals for this round)
- Newsletter subscription wiring to a real provider
- Notification preference settings
- Account deletion / data export (GDPR)
- Practitioner-only public-profile fields (bio, credentials, photo gallery)
- Email-change verify-then-apply flow
- Avatar file cleanup from Directus storage on remove (only the user reference is cleared)
- MFA / 2FA
- Theme preference moved off localStorage to user account

## Architecture

- **Page shell:** `astro/src/pages/profile.astro` — slim Astro page that mounts a single React island.
- **React island:** `astro/src/components/profile/ProfilePanel.tsx` (top-level) plus five subcomponents. Independent forms, shared `user` prop and `refreshUser()` callback.
- **API endpoints:** Astro routes under `astro/src/pages/api/auth/` proxy Directus calls. All state-changing endpoints go through `validateCsrfToken`, `checkRateLimit`, and `getRequestAccessToken(request, locals)`. This matches the existing pattern in `astro/src/pages/api/auth/profile.ts`, `register.ts`, etc.
- **Directus changes:** one new collection (`user_preferences`) with row-level permissions; one permission tweak on `directus_users.avatar`.

## Component design

```
astro/src/components/profile/
  ProfilePanel.tsx                    ← top-level: fetches /api/auth/me; auth-state branching
  IdentitySection.tsx                  ← first_name, last_name, email
  PasswordSection.tsx                  ← current_password, new_password, confirm_new_password
  AvatarSection.tsx                    ← thumbnail + upload + remove
  PreferredPractitionerSection.tsx     ← display + remove + link to browse
  EmailVerificationSection.tsx         ← verified badge OR resend button
```

Each section:
- Has its own submit button labeled by action ("Save name", "Update password", etc.)
- Renders inline status: idle / saving / success / error. Success auto-clears after ~3s; errors persist until next submit.
- Receives `user` and `refreshUser()` as props from `ProfilePanel`.
- Uses `apiFetch` from `astro/src/lib/api-client.ts` (handles CSRF header).

**Data sources per section:**
- `IdentitySection`, `PasswordSection`, `AvatarSection`, `EmailVerificationSection`: read from the `user` prop (the `/api/auth/me` payload).
- `PreferredPractitionerSection`: makes its own `GET /api/auth/preferences` call on mount (separate data source from `me`). Owns its own loading state for that fetch.

**`ProfilePanel` states:**
1. Initial load: spinner.
2. `me` returns no user: render "Sign in required" panel with link to `/login`.
3. Authed: render the five sections.
4. Any subsection's submit returns 401: show top-level "Session expired — please sign in again" banner; redirect to `/login` after 2s. (Middleware already refreshes transparently — a bare 401 here means the refresh failed too.)

**Per-section UX details:**
- **Identity:** changing the `email` field reveals an inline disclosure with a `current_password` input. `first_name`/`last_name` changes don't require it.
- **Password:** all three fields visible; client-side mismatch check before submit.
- **Avatar:** thumbnail with rounded-full crop, file picker button, remove button if avatar exists. Upload-on-confirm, no preview before upload (kept simple). Client-side guards on size and MIME type for friendlier errors.
- **Preferred practitioner:** if set, show name + Remove button. If not, show "No preferred practitioner — browse and select one →" link. Setting one happens on the practitioner detail page (see "Practitioner detail page change" below).
- **Email verification:** if `email_verified === true`, green check + "Verified". If false, amber banner + Resend button. After Resend: button disables for 60s with "Sent — check your inbox".

**Visual styling:** matches the existing dashboard card style — `bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6 shadow-sm`. Sage-600 for primary buttons, red-* for destructive. No new design tokens.

## API endpoints

All endpoints follow the existing auth-area pattern:
- `validateCsrfToken(request)` — 403 on mismatch.
- `checkRateLimit(...)` — 429 on exceed (with `Retry-After` header).
- `getRequestAccessToken(request, locals)` — 401 if missing.
- Errors returned as `{ error: "<human message>" }` with non-2xx status.
- `Content-Type: application/json` on all JSON responses.

### `PATCH /api/auth/profile` (extension to existing endpoint)

Request body (any subset):
```ts
{
  first_name?: string,
  last_name?: string,
  email?: string,            // requires current_password
  password?: string,         // requires current_password
  current_password?: string, // required iff email or password is present
}
```

Behavior:
- If `email` or `password` is present and `current_password` is missing → 400 `{ error: "current_password required" }`.
- Verify `current_password` by calling Directus `POST /auth/login` with the *current* email + provided `current_password`. If 401, respond 401 `{ error: "Current password is incorrect" }`. Discard the resulting token.
- On success, PATCH `/users/me` with the change set.
- Returns `{ success: true, user: { id, first_name, last_name, email } }`.

Rate limit: `RATE_LIMITS.api`.

### `POST /api/auth/avatar` (new)

- Content-Type: `multipart/form-data`, single field `file`.
- Server-side validation:
  - MIME type ∈ `{image/jpeg, image/png, image/webp}` → else 415 `{ error: "Unsupported file type" }`.
  - Size ≤ 2 MB → else 413 `{ error: "File too large (max 2MB)" }`.
- Pipeline:
  1. Read multipart form.
  2. Build a new `FormData`, append the `File` blob.
  3. POST to Directus `/files` with `Authorization: Bearer <access_token>`.
  4. Read `data.id` from the response.
  5. PATCH `/users/me { avatar: <file_id> }`.
- Returns `{ success: true, avatar: <file_id> }`.

Rate limit: `RATE_LIMITS.api`.

### `DELETE /api/auth/avatar` (new)

- PATCH `/users/me { avatar: null }`. Does **not** delete the file from Directus storage (deferred).
- Returns `{ success: true }`.

Rate limit: `RATE_LIMITS.api`.

### `GET /api/auth/preferences` (new)

- Reads `user_preferences` row where `user == me` (Directus filter).
- Field expansion: `?fields=preferred_practitioner.id,preferred_practitioner.first_name,preferred_practitioner.last_name`.
- If no row exists, returns `{ preferred_practitioner: null }` (does not auto-create).
- Returns `{ preferred_practitioner: { id, first_name, last_name } | null }`.

No CSRF (read-only). Rate limit: `RATE_LIMITS.api`.

### `PATCH /api/auth/preferences` (new)

Request body:
```ts
{ preferred_practitioner: string | null }   // practitioner id, or null to clear
```

Behavior (upsert):
1. GET the existing `user_preferences` row for current user.
2. If exists, PATCH it with the new `preferred_practitioner`.
3. If not, POST a new row with `{ user: <me>, preferred_practitioner }`.
- Returns `{ success: true, preferences: { preferred_practitioner: ... } }`.

Rate limit: `RATE_LIMITS.api`.

### `POST /api/auth/resend-verification` (new)

- Reads `me` to get current email and `email_verified`.
- If already verified → 400 `{ error: "Email already verified" }`.
- Otherwise: trigger the same verification-email path used by the register flow. Implementation reads `astro/src/pages/api/auth/register.ts` and `directus/extensions/` to find the actual call (likely a Directus extension endpoint or a `users/invite`-style flow). If no reusable path exists, build a minimal `directus/extensions/auth-resend-verify/` endpoint.
- Returns `{ success: true }` regardless of whether the user existed/was unverified at the Directus level (don't leak account state).

Rate limit: new tighter limit — `RATE_LIMITS.verification = { interval: 60*60*1000, maxRequests: 3 }`. Keyed on `verification:<user_id>` (per-user, not per-IP, since the user is authenticated).

## Data model changes (Directus)

### New collection: `user_preferences`

| Field                            | Type                | Notes                                                           |
|----------------------------------|---------------------|-----------------------------------------------------------------|
| `id`                             | uuid (PK)           | standard Directus PK                                            |
| `user`                           | M2O → directus_users | required, **unique** (one row per user); on-delete cascade      |
| `preferred_practitioner`         | M2O → practitioners  | nullable; on-delete set null                                    |
| `date_created`, `date_updated`   | Directus auto       | standard                                                        |
| `user_created`, `user_updated`   | Directus auto       | standard                                                        |

Permissions:
- **Patient Access** and **Professional Access**: full CRUD where `user == $CURRENT_USER`.
- **Public**: no access.
- **Administrator**: full access.

The unique constraint on `user` enables clean upsert semantics in `PATCH /api/auth/preferences`.

### `directus_users.avatar` permissions

The `avatar` field already exists on the system collection. Confirm during implementation that **Patient Access** and **Professional Access** roles can PATCH this field on `/users/me` (i.e. for `id == $CURRENT_USER`). If not on the whitelist, add it.

### Email verification

Reuses the existing register-time verification path. No new field — `directus_users.email_verified` already exists and is set by the register flow. Implementation will inspect `astro/src/pages/api/auth/register.ts` and `directus/extensions/` to determine the concrete call to mirror.

### Snapshot deliverable

Schema changes are exported as a snapshot file at `directus/snapshots/2026-05-08-user-preferences.yaml`. Prod applies via `npx directus schema apply` per the existing operations playbook.

## Practitioner detail page change

Add a "Set as my practitioner" button to `astro/src/pages/practitioners/[id].astro`:
- Visible only when the user is signed in (gated by checking `/api/auth/me`).
- On click: PATCH `/api/auth/preferences { preferred_practitioner: <this_id> }`.
- After success: shows "✓ Set as your practitioner" inline.

Without this, the profile page can only *clear* a preferred practitioner, not set one.

## Dashboard cleanup

Remove from `astro/src/pages/dashboard.astro`:
- The "Change Password" form card and its `change-password-form` script handler.
- The "My Practitioner" card (display-only, never wired) and its handlers.

Keep on dashboard:
- Theme toggle (covered by `DarkModeToggle` component used elsewhere; no API surface change).
- Newsletter toggle (still localStorage-only, deferred from this round; flagged as deferred).
- Sign Out button.

Add to dashboard:
- A prominent "Manage your profile →" link/card directing to `/profile`.

## Testing

### Vitest (unit / endpoint)

New test files in `astro/__tests__/api/`:
- `profile-patch.test.ts` — `PATCH /api/auth/profile`:
  - rejects missing `current_password` for email change → 400
  - rejects wrong `current_password` → 401
  - accepts name-only change without `current_password`
  - accepts email change with correct `current_password`
- `avatar.test.ts` — `POST /api/auth/avatar`, `DELETE /api/auth/avatar`:
  - rejects unsupported MIME → 415
  - rejects oversized file → 413
  - happy path uploads + sets avatar
  - delete clears avatar field
- `preferences.test.ts` — `GET` and `PATCH /api/auth/preferences`:
  - GET returns null when no row exists
  - PATCH creates row on first call (upsert behavior)
  - PATCH updates row on subsequent call
  - PATCH null clears preferred practitioner
- `resend-verification.test.ts`:
  - rejects already-verified user → 400
  - rate-limit kicks in after 3 calls in an hour
  - returns generic success regardless

Mock Directus HTTP responses with `vi.fn()` against `globalThis.fetch`.

### Playwright (E2E)

New test file `astro/tests/e2e/profile.spec.ts`:
- Sign-in → visit `/profile` → change first name → see updated greeting on dashboard.
- Visit `/profile` while logged out → see "Sign in required".
- Upload an avatar → see thumbnail update.
- Remove avatar → see default placeholder.
- Visit `/practitioners/<id>` → click "Set as my practitioner" → return to `/profile` → see practitioner shown.
- Click Resend on unverified account → see "Sent" state with disabled button.

E2E requires a seeded test user in Directus. If no fixture exists, add one as part of the test setup (script under `astro/tests/e2e/fixtures/`).

### Manual test matrix (run before merge)

Beyond the automated tests, manually verify:
1. Email change with wrong `current_password` → friendly inline error.
2. Email change with correct `current_password` → cookie session still valid (no logout).
3. Password change → old password no longer logs in.
4. Avatar 5 MB PNG → 413 friendly message in UI (not a Directus stack trace).
5. Avatar `.pdf` upload attempt → 415 friendly message.
6. Session expires mid-edit → "session expired" banner + redirect.

## Error handling principles

- **Server:** never leak Directus internals. Translate to user-friendly messages (existing pattern: `error?.errors?.[0]?.message || "Failed to update profile"`).
- **Client:** each section is independent. Failure in one doesn't block others. No global try/catch swallowing.
- **Validation:** validate client-side for friendliness; never trust client validation — server validates everything (size, MIME, current-password).

## Rollout

Single PR back to `main`. Inside the PR, the diff includes:
1. Directus snapshot file (`directus/snapshots/2026-05-08-user-preferences.yaml`).
2. New + modified Astro endpoints under `astro/src/pages/api/auth/`.
3. New React island under `astro/src/components/profile/`.
4. Modified `astro/src/pages/profile.astro` (mount the island).
5. Modified `astro/src/pages/dashboard.astro` (remove duplicated forms, add profile link).
6. Modified `astro/src/pages/practitioners/[id].astro` (add "Set as my practitioner" button).
7. New Vitest tests + new Playwright E2E test.
8. New rate-limit entry: `RATE_LIMITS.verification`.

**Deployment order at merge time:**
1. Apply the Directus schema snapshot to prod (`npx directus schema apply` against `https://backend.verscienta.com`).
2. Confirm the `Patient Access` and `Professional Access` roles can PATCH `directus_users.avatar` and CRUD their own `user_preferences` rows (Directus admin UI spot-check).
3. Merge PR → Cloudflare CI auto-deploys the Astro app.
4. Smoke-test on prod: sign in → visit `/profile` → change name → confirm.

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Schema snapshot apply fails in prod | Test snapshot apply on a fresh local Directus instance before deploying. |
| `/users/me` PATCH on `avatar` blocked by role permissions | Explicitly verify and document the required role permission as part of the schema change; spot-check in prod admin UI before declaring rollout complete. |
| "Set as my practitioner" button exposed to logged-out users | Show only when `/api/auth/me` returns a user. |
| Email change locks out a typo'd user | Explicit warning copy near the email field ("You'll need to use this email to sign in"). Verify-then-apply flow is a deferred follow-up. |
| Verification-email spam abuse | Per-user rate limit of 3/hour on `POST /api/auth/resend-verification`. |
| Stolen session changes email or password | Mitigated by `current_password` requirement for both. |

## Open implementation questions

These are intentionally left for the implementation phase to resolve by reading existing code:
- Exact mechanism the register flow uses to send the initial verification email (will be inspected in `astro/src/pages/api/auth/register.ts` and `directus/extensions/`).
- Whether `directus_users.avatar` is on the role's editable-fields whitelist by default (will be checked in Directus admin during schema work).
