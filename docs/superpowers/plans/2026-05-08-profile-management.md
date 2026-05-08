# Profile Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated `/profile` page (React island) where signed-in users can manage identity, password, avatar, preferred practitioner, and email verification status — replacing the duplicated account UI on `/dashboard`.

**Architecture:** A single React island (`ProfilePanel`) on a slim Astro shell page, with five independent subsections. New Astro API endpoints under `/api/auth/*` proxy Directus calls following the existing CSRF + rate-limit + bearer-token pattern. One new Directus collection (`user_preferences`) and one small Directus extension (`auth-resend-verify`).

**Tech Stack:** Astro 5, React 19, TypeScript, Directus 11 (Node SDK), Tailwind v4, Vitest 3, Playwright 1.49.

**Spec:** See [docs/superpowers/specs/2026-05-08-profile-management-design.md](../specs/2026-05-08-profile-management-design.md).

**Worktree:** `claude/compassionate-gauss-e4863f`. All commits land on this branch; final PR merges to `main`.

---

## File Structure

**Created:**
- `directus/snapshots/2026-05-08-user-preferences.yaml` — Directus schema snapshot for prod apply
- `directus/extensions/auth-resend-verify/index.js` — endpoint extension: POST /auth-resend-verify
- `directus/extensions/auth-resend-verify/package.json` — extension manifest
- `astro/src/pages/api/auth/avatar.ts` — POST/DELETE avatar
- `astro/src/pages/api/auth/preferences.ts` — GET/PATCH user preferences
- `astro/src/pages/api/auth/resend-verification.ts` — POST resend verification
- `astro/src/components/profile/ProfilePanel.tsx` — top-level island
- `astro/src/components/profile/IdentitySection.tsx`
- `astro/src/components/profile/PasswordSection.tsx`
- `astro/src/components/profile/AvatarSection.tsx`
- `astro/src/components/profile/PreferredPractitionerSection.tsx`
- `astro/src/components/profile/EmailVerificationSection.tsx`
- `astro/src/components/profile/SetAsMyPractitionerButton.tsx` — used on practitioner detail page
- `astro/__tests__/api/profile-patch.test.ts`
- `astro/__tests__/api/avatar.test.ts`
- `astro/__tests__/api/preferences.test.ts`
- `astro/__tests__/api/resend-verification.test.ts`
- `astro/__tests__/api/_helpers.ts` — shared test fixtures (mocked fetch, request builder)
- `astro/e2e/profile.spec.ts` — Playwright E2E
- `astro/e2e/fixtures/users.ts` — test user creation helper

**Modified:**
- `astro/src/pages/api/auth/profile.ts` — add `current_password` gate for email/password
- `astro/src/lib/rate-limit.ts` — add `RATE_LIMITS.verification`
- `astro/src/lib/auth.ts` — extend `getCurrentUser` to include `email_verified`
- `astro/src/pages/profile.astro` — mount `<ProfilePanel client:load />`
- `astro/src/pages/dashboard.astro` — remove change-password form + practitioner card; add "Manage your profile" link
- `astro/src/pages/practitioners/[id].astro` — mount `<SetAsMyPractitionerButton client:load>` if user logged in
- `astro/vitest.config.ts` — extend `coverage.include` to also cover `src/pages/api/**`

**Deleted:** none.

---

## Conventions used throughout this plan

- **Test commands** run from `astro/` directory: `cd astro && npm run test -- <pattern>`. Plan commands assume the engineer's shell `cwd` is the worktree root.
- **All endpoint files** follow this skeleton (matches existing `astro/src/pages/api/auth/profile.ts`):
  ```ts
  import type { APIRoute } from "astro";
  import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
  import { validateCsrfToken } from "@/lib/csrf";
  import { getRequestAccessToken } from "@/lib/auth-server";

  const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";
  ```
- **Commit style:** matches existing repo (`feat(scope): ...`, `chore(scope): ...`, `test(scope): ...`).
- **TDD discipline:** write the test, see it fail, write the code, see it pass, commit. Each task spells out all five steps.

---

## Phase 1: Directus schema and extension

### Task 1: Add `user_preferences` collection in local Directus

**Files:**
- Modify: local Directus instance via admin UI at `http://localhost:8055/admin`

This task is **operational, not code** — it's done in the Directus admin UI. The next task exports the result to a snapshot file.

- [ ] **Step 1: Start local Directus**

```bash
cd directus && docker compose up -d
```

Wait until `http://localhost:8055/admin` responds.

- [ ] **Step 2: Create the `user_preferences` collection in admin UI**

In Settings → Data Model → Create Collection:
- Collection name: `user_preferences`
- Primary key field: `id` (UUID, auto-generated)
- Add system fields: `date_created`, `date_updated`, `user_created`, `user_updated`
- Save.

Then add fields:
- `user`: many-to-one → `directus_users`, required, **unique**, on-delete: cascade
- `preferred_practitioner`: many-to-one → `practitioners`, nullable, on-delete: set null

- [ ] **Step 3: Configure permissions**

In Settings → Access Policies (or Roles, depending on Directus version):
- For role **Patient Access**: add `user_preferences` with full CRUD where `user._eq == $CURRENT_USER`.
- For role **Professional Access**: same as above.
- For role **Public**: no access.
- For role **Administrator**: full access.

- [ ] **Step 4: Verify the unique constraint**

Try inserting two rows with the same `user` value via the admin UI. Should reject the second one. If not, edit the field and check the "Unique" toggle is on.

- [ ] **Step 5: Verify avatar permissions**

Go to **Patient Access** role → directus_users permissions → Update tab. Confirm the field whitelist includes `avatar`. If not, add it. Repeat for **Professional Access**.

No commit yet — Task 2 produces the snapshot file that gets committed.

---

### Task 2: Export and commit the schema snapshot

**Files:**
- Create: `directus/snapshots/2026-05-08-user-preferences.yaml`

- [ ] **Step 1: Export snapshot from running Directus**

```bash
cd directus && docker compose exec directus npx directus schema snapshot ./snapshots/2026-05-08-user-preferences.yaml --yes
```

If Directus runs outside docker, use:
```bash
cd directus && npx directus schema snapshot ./snapshots/2026-05-08-user-preferences.yaml --yes
```

Expected output: `Snapshot saved successfully` and a YAML file at the path above.

- [ ] **Step 2: Verify snapshot contains the new collection**

```bash
grep -A 2 "user_preferences" directus/snapshots/2026-05-08-user-preferences.yaml | head -20
```

Expected: lines mentioning `user_preferences` and the two M2O relations.

- [ ] **Step 3: Commit**

```bash
git add directus/snapshots/2026-05-08-user-preferences.yaml
git commit -m "chore(directus): snapshot user_preferences collection"
```

---

### Task 3: Build `auth-resend-verify` Directus extension

**Files:**
- Create: `directus/extensions/auth-resend-verify/index.js`
- Create: `directus/extensions/auth-resend-verify/package.json`

**Background for the engineer:** Directus has no built-in resend-verification endpoint. The register flow at `astro/src/pages/api/auth/register.ts` calls Directus `/users/register` which sends the initial email automatically. We need a small endpoint extension that, given an authenticated user, regenerates a verification link and emails it.

The extension uses Directus's `MailService` and signs a short-lived JWT with Directus's secret. The verify-link endpoint already exists at `astro/src/pages/api/auth/verify-email.ts` and proxies to Directus's built-in `/users/register/verify-email?token=...` — but that built-in only accepts tokens Directus itself issued. So this extension issues a **new** Directus-format verification token by setting `directus_users.email_verification_token` directly (a field Directus uses internally) and then sending it.

If during implementation it becomes clear that Directus's internal token format/storage has changed in v11 in a way that prevents this, the alternative is to build a minimal end-to-end flow: extension issues an HMAC token, a NEW endpoint `astro/src/pages/api/auth/verify-email-resend.ts` accepts that token, validates it, and PATCHes `email_verified=true` via the admin token.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "directus-extension-auth-resend-verify",
  "version": "1.0.0",
  "type": "module",
  "directus:extension": {
    "type": "endpoint",
    "path": "index.js",
    "host": "^11.0.0"
  }
}
```

File: `directus/extensions/auth-resend-verify/package.json`.

- [ ] **Step 2: Write the extension**

File: `directus/extensions/auth-resend-verify/index.js`:

```js
import jwt from "jsonwebtoken";

export default {
  id: "auth-resend-verify",
  handler: (router, { services, getSchema, env, logger }) => {
    router.post("/", async (req, res) => {
      try {
        if (!req.accountability?.user) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const userId = req.accountability.user;
        const schema = await getSchema();
        const usersService = new services.UsersService({ schema, accountability: { admin: true } });

        const user = await usersService.readOne(userId, {
          fields: ["id", "email", "email_verified"],
        });

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        if (user.email_verified) {
          return res.status(400).json({ error: "Email already verified" });
        }

        // Issue a verification token (24h)
        const token = jwt.sign(
          { id: user.id, email: user.email, scope: "email-verify" },
          env.SECRET,
          { expiresIn: "24h", issuer: "directus" }
        );

        // Persist token so /users/register/verify-email accepts it
        await usersService.updateOne(user.id, {
          email_verification_token: token,
        });

        const publicUrl = env.PUBLIC_URL || "https://verscienta.com";
        const verifyUrl = `${publicUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

        const mailService = new services.MailService({ schema });
        await mailService.send({
          to: user.email,
          subject: "Verify your Verscienta Health email",
          template: {
            name: "user-invitation",
            data: { url: verifyUrl, email: user.email },
          },
          // Fallback plain text if template missing
          text: `Click this link to verify your email: ${verifyUrl}`,
        });

        return res.status(200).json({ success: true });
      } catch (err) {
        logger.error({ err }, "auth-resend-verify failed");
        return res.status(500).json({ error: "Failed to send verification email" });
      }
    });
  },
};
```

- [ ] **Step 3: Restart Directus to load the extension**

```bash
cd directus && docker compose restart directus
```

Watch logs for `auth-resend-verify` registration; expected: a line like `Loaded extension auth-resend-verify`.

- [ ] **Step 4: Smoke-test the extension**

In a terminal with a valid access_token cookie (or a manually-issued admin token), POST to `http://localhost:8055/auth-resend-verify`:

```bash
curl -X POST http://localhost:8055/auth-resend-verify \
  -H "Authorization: Bearer <ACCESS_TOKEN_FOR_AN_UNVERIFIED_USER>"
```

Expected: `{"success":true}` and a verification email in the configured mailer (or in the docker logs if using `EMAIL_TRANSPORT=sendmail`/console transport).

If `email_verification_token` field doesn't exist on `directus_users` in v11, fall back to the alternative HMAC flow noted in Task 3 background. Document the chosen path in a one-line code comment at the top of `index.js`.

- [ ] **Step 5: Commit**

```bash
git add directus/extensions/auth-resend-verify/
git commit -m "feat(directus): auth-resend-verify endpoint extension"
```

---

## Phase 2: Astro backend — extend rate limits, profile endpoint, new endpoints

### Task 4: Add `RATE_LIMITS.verification`

**Files:**
- Modify: `astro/src/lib/rate-limit.ts`

- [ ] **Step 1: Write the failing test**

Append to a new file `astro/__tests__/lib/rate-limit-verification.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { RATE_LIMITS } from "../../src/lib/rate-limit";

describe("RATE_LIMITS.verification", () => {
  it("allows 3 attempts per hour", () => {
    expect(RATE_LIMITS.verification).toEqual({
      interval: 60 * 60 * 1000,
      maxRequests: 3,
    });
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
cd astro && npm run test -- rate-limit-verification
```

Expected: FAIL with `RATE_LIMITS.verification` is undefined.

- [ ] **Step 3: Add the limit**

In `astro/src/lib/rate-limit.ts`, find the `RATE_LIMITS` object and add the new entry:

```ts
export const RATE_LIMITS = {
  auth: { interval: 15 * 60 * 1000, maxRequests: 10 },
  api: { interval: 60 * 1000, maxRequests: 60 },
  ai: { interval: 60 * 1000, maxRequests: 10 },
  search: { interval: 60 * 1000, maxRequests: 30 },
  symbolic: { interval: 60 * 1000, maxRequests: 15 },
  verification: { interval: 60 * 60 * 1000, maxRequests: 3 },
} as const;
```

- [ ] **Step 4: Run test, verify it passes**

```bash
cd astro && npm run test -- rate-limit-verification
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add astro/src/lib/rate-limit.ts astro/__tests__/lib/rate-limit-verification.test.ts
git commit -m "feat(rate-limit): add per-hour verification rate limit"
```

---

### Task 5: Test helpers for endpoint tests

**Files:**
- Create: `astro/__tests__/api/_helpers.ts`

- [ ] **Step 1: Write the helper file**

File: `astro/__tests__/api/_helpers.ts`:

```ts
/**
 * Shared helpers for endpoint tests.
 * Builds Request objects with a CSRF cookie + header pre-installed,
 * and a `mockFetch` to stub Directus responses.
 */
import { vi } from "vitest";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, generateCsrfToken } from "../../src/lib/csrf";

export interface BuildRequestOpts {
  method?: string;
  url?: string;
  body?: unknown;
  bodyFormData?: FormData;
  accessToken?: string | null;
  csrf?: boolean;
}

export function buildRequest(opts: BuildRequestOpts = {}): Request {
  const {
    method = "GET",
    url = "http://localhost/api/test",
    body,
    bodyFormData,
    accessToken = "test-access-token",
    csrf = true,
  } = opts;

  const headers = new Headers();
  const cookies: string[] = [];
  if (accessToken) cookies.push(`access_token=${accessToken}`);
  if (csrf) {
    const token = generateCsrfToken();
    cookies.push(`${CSRF_COOKIE_NAME}=${token}`);
    headers.set(CSRF_HEADER_NAME, token);
  }
  if (cookies.length) headers.set("cookie", cookies.join("; "));

  let init: RequestInit = { method, headers };
  if (bodyFormData) {
    init.body = bodyFormData;
  } else if (body !== undefined) {
    headers.set("content-type", "application/json");
    init.body = JSON.stringify(body);
  }

  return new Request(url, init);
}

export interface MockFetchResponse {
  status?: number;
  body?: unknown;
  ok?: boolean;
}

/**
 * Replace global fetch with a queue of mocked responses.
 * Returns the spy so tests can assert on call args.
 */
export function mockFetch(responses: MockFetchResponse[]) {
  const queue = [...responses];
  const spy = vi.fn(async () => {
    const next = queue.shift();
    if (!next) throw new Error("mockFetch: no more queued responses");
    const status = next.status ?? 200;
    return new Response(next.body !== undefined ? JSON.stringify(next.body) : null, {
      status,
      headers: { "content-type": "application/json" },
    });
  });
  globalThis.fetch = spy as unknown as typeof fetch;
  return spy;
}

/**
 * Helper: a Locals object as Astro provides to API routes.
 * (Middleware may have stashed an access token here; tests don't need to.)
 */
export const emptyLocals = {} as never;
```

- [ ] **Step 2: Verify it imports correctly**

```bash
cd astro && npx tsc --noEmit __tests__/api/_helpers.ts
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add astro/__tests__/api/_helpers.ts
git commit -m "test(api): shared endpoint test helpers"
```

---

### Task 6: Extend `PATCH /api/auth/profile` with `current_password` gate

**Files:**
- Modify: `astro/src/pages/api/auth/profile.ts`
- Create: `astro/__tests__/api/profile-patch.test.ts`

- [ ] **Step 1: Write the failing tests**

File: `astro/__tests__/api/profile-patch.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildRequest, mockFetch, emptyLocals } from "./_helpers";
import { PATCH } from "../../src/pages/api/auth/profile";

describe("PATCH /api/auth/profile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects when CSRF token is missing", async () => {
    const req = buildRequest({ method: "PATCH", body: { first_name: "Alice" }, csrf: false });
    const res = await PATCH({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(403);
  });

  it("rejects when not authenticated", async () => {
    const req = buildRequest({ method: "PATCH", body: { first_name: "Alice" }, accessToken: null });
    const res = await PATCH({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(401);
  });

  it("allows name change without current_password", async () => {
    mockFetch([{ status: 200, body: { data: { id: "u1", first_name: "Alice" } } }]);
    const req = buildRequest({ method: "PATCH", body: { first_name: "Alice" } });
    const res = await PATCH({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(200);
  });

  it("rejects email change without current_password", async () => {
    const req = buildRequest({ method: "PATCH", body: { email: "new@example.com" } });
    const res = await PATCH({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/current_password/);
  });

  it("rejects password change without current_password", async () => {
    const req = buildRequest({ method: "PATCH", body: { password: "newpass123" } });
    const res = await PATCH({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(400);
  });

  it("rejects when current_password is wrong", async () => {
    // 1st fetch: GET /users/me (to get current email) → returns user
    // 2nd fetch: POST /auth/login (verify password) → 401
    mockFetch([
      { status: 200, body: { data: { id: "u1", email: "old@example.com" } } },
      { status: 401, body: { errors: [{ message: "Invalid credentials" }] } },
    ]);
    const req = buildRequest({
      method: "PATCH",
      body: { email: "new@example.com", current_password: "wrong" },
    });
    const res = await PATCH({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/incorrect/i);
  });

  it("accepts email change with correct current_password", async () => {
    // 1st: GET /users/me → returns user
    // 2nd: POST /auth/login → 200 (password OK)
    // 3rd: PATCH /users/me → 200
    mockFetch([
      { status: 200, body: { data: { id: "u1", email: "old@example.com" } } },
      { status: 200, body: { data: { access_token: "tmp" } } },
      { status: 200, body: { data: { id: "u1", email: "new@example.com" } } },
    ]);
    const req = buildRequest({
      method: "PATCH",
      body: { email: "new@example.com", current_password: "right" },
    });
    const res = await PATCH({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
cd astro && npm run test -- profile-patch
```

Expected: 5 of 7 tests fail (current_password gate not implemented). The first two (CSRF, auth) likely pass already since the existing endpoint enforces those.

- [ ] **Step 3: Modify the endpoint**

Replace the entire body of `astro/src/pages/api/auth/profile.ts` with:

```ts
/**
 * PATCH /api/auth/profile
 * Update user profile via Directus. Email and password changes require
 * `current_password` to defend against stolen-session attacks.
 */
import type { APIRoute } from "astro";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { getRequestAccessToken } from "@/lib/auth-server";

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";

export const PATCH: APIRoute = async ({ request, locals }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:profile:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(
      JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }),
      { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }

  try {
    const accessToken = getRequestAccessToken(request, locals);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { first_name, last_name, email, password, current_password } = body;

    const requiresPassword = email !== undefined || password !== undefined;
    if (requiresPassword && !current_password) {
      return new Response(
        JSON.stringify({ error: "current_password required to change email or password." }),
        { status: 400, headers: { "Content-Type": "application/json", ...rlHeaders } }
      );
    }

    if (requiresPassword) {
      // Look up the user's current email for the auth check.
      const meRes = await fetch(`${DIRECTUS_URL}/users/me?fields=id,email`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!meRes.ok) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...rlHeaders },
        });
      }
      const meJson = await meRes.json();
      const currentEmail = meJson?.data?.email;
      if (!currentEmail) {
        return new Response(JSON.stringify({ error: "Could not verify identity." }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...rlHeaders },
        });
      }

      const verifyRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail, password: current_password }),
      });
      if (!verifyRes.ok) {
        return new Response(JSON.stringify({ error: "Current password is incorrect." }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...rlHeaders },
        });
      }
      // Discard the returned token; we don't use it.
    }

    const updateData: Record<string, unknown> = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) updateData.password = password;

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: "No fields to update." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...rlHeaders },
      });
    }

    const updateResponse = await fetch(`${DIRECTUS_URL}/users/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: error?.errors?.[0]?.message || "Failed to update profile" }),
        { status: updateResponse.status, headers: { "Content-Type": "application/json", ...rlHeaders } }
      );
    }

    const result = await updateResponse.json();
    return new Response(JSON.stringify({ success: true, user: result.data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  } catch (error: unknown) {
    console.error("Profile update error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Profile update failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
cd astro && npm run test -- profile-patch
```

Expected: 7/7 PASS.

- [ ] **Step 5: Commit**

```bash
git add astro/src/pages/api/auth/profile.ts astro/__tests__/api/profile-patch.test.ts
git commit -m "feat(auth): require current_password for email/password change"
```

---

### Task 7: GET / PATCH `/api/auth/preferences` (upsert semantics)

**Files:**
- Create: `astro/src/pages/api/auth/preferences.ts`
- Create: `astro/__tests__/api/preferences.test.ts`

- [ ] **Step 1: Write the failing tests**

File: `astro/__tests__/api/preferences.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildRequest, mockFetch, emptyLocals } from "./_helpers";
import { GET, PATCH } from "../../src/pages/api/auth/preferences";

describe("GET /api/auth/preferences", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns 401 if not authenticated", async () => {
    const req = buildRequest({ method: "GET", accessToken: null });
    const res = await GET({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(401);
  });

  it("returns null preferred_practitioner when no row exists", async () => {
    // 1: /users/me → user
    // 2: /items/user_preferences?filter → empty
    mockFetch([
      { status: 200, body: { data: { id: "u1" } } },
      { status: 200, body: { data: [] } },
    ]);
    const req = buildRequest({ method: "GET" });
    const res = await GET({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ preferred_practitioner: null });
  });

  it("returns the practitioner when a row exists", async () => {
    mockFetch([
      { status: 200, body: { data: { id: "u1" } } },
      {
        status: 200,
        body: {
          data: [
            {
              id: "p1",
              preferred_practitioner: { id: "doc1", first_name: "Jane", last_name: "Doe" },
            },
          ],
        },
      },
    ]);
    const req = buildRequest({ method: "GET" });
    const res = await GET({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.preferred_practitioner).toEqual({ id: "doc1", first_name: "Jane", last_name: "Doe" });
  });
});

describe("PATCH /api/auth/preferences", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("rejects without CSRF", async () => {
    const req = buildRequest({
      method: "PATCH",
      body: { preferred_practitioner: "doc1" },
      csrf: false,
    });
    const res = await PATCH({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(403);
  });

  it("creates a new row on first call (upsert)", async () => {
    // 1: /users/me → user
    // 2: GET filter → empty
    // 3: POST /items/user_preferences → created
    mockFetch([
      { status: 200, body: { data: { id: "u1" } } },
      { status: 200, body: { data: [] } },
      { status: 200, body: { data: { id: "p1", preferred_practitioner: "doc1" } } },
    ]);
    const req = buildRequest({
      method: "PATCH",
      body: { preferred_practitioner: "doc1" },
    });
    const res = await PATCH({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("updates an existing row on subsequent call (upsert)", async () => {
    mockFetch([
      { status: 200, body: { data: { id: "u1" } } },
      { status: 200, body: { data: [{ id: "p1", preferred_practitioner: "old" }] } },
      { status: 200, body: { data: { id: "p1", preferred_practitioner: "doc2" } } },
    ]);
    const req = buildRequest({
      method: "PATCH",
      body: { preferred_practitioner: "doc2" },
    });
    const res = await PATCH({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(200);
  });

  it("clears preferred_practitioner with null", async () => {
    mockFetch([
      { status: 200, body: { data: { id: "u1" } } },
      { status: 200, body: { data: [{ id: "p1", preferred_practitioner: "doc1" }] } },
      { status: 200, body: { data: { id: "p1", preferred_practitioner: null } } },
    ]);
    const req = buildRequest({
      method: "PATCH",
      body: { preferred_practitioner: null },
    });
    const res = await PATCH({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
cd astro && npm run test -- preferences
```

Expected: import error — file doesn't exist yet.

- [ ] **Step 3: Write the endpoint**

File: `astro/src/pages/api/auth/preferences.ts`:

```ts
/**
 * GET  /api/auth/preferences  → read the user_preferences row for current user
 * PATCH /api/auth/preferences → upsert preferred_practitioner
 */
import type { APIRoute } from "astro";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { getRequestAccessToken } from "@/lib/auth-server";

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";

const PRACTITIONER_FIELDS = "preferred_practitioner.id,preferred_practitioner.first_name,preferred_practitioner.last_name";

interface PreferencesRow {
  id: string;
  preferred_practitioner: { id: string; first_name?: string; last_name?: string } | string | null;
}

async function fetchMe(accessToken: string): Promise<{ id: string } | null> {
  const res = await fetch(`${DIRECTUS_URL}/users/me?fields=id`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}

async function fetchPreferencesRow(accessToken: string, userId: string): Promise<PreferencesRow | null> {
  const url = `${DIRECTUS_URL}/items/user_preferences?filter[user][_eq]=${encodeURIComponent(userId)}&fields=id,${PRACTITIONER_FIELDS}&limit=1`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data?.[0] ?? null;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:prefs:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const accessToken = getRequestAccessToken(request, locals);
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const me = await fetchMe(accessToken);
  if (!me) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const row = await fetchPreferencesRow(accessToken, me.id);
  const preferred = row?.preferred_practitioner;
  const expanded =
    preferred && typeof preferred === "object"
      ? { id: preferred.id, first_name: preferred.first_name, last_name: preferred.last_name }
      : null;

  return new Response(JSON.stringify({ preferred_practitioner: expanded }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...rlHeaders },
  });
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:prefs:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const accessToken = getRequestAccessToken(request, locals);
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json().catch(() => ({}));
  if (!Object.prototype.hasOwnProperty.call(body, "preferred_practitioner")) {
    return new Response(JSON.stringify({ error: "preferred_practitioner is required (use null to clear)." }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }
  const value: string | null = body.preferred_practitioner;

  const me = await fetchMe(accessToken);
  if (!me) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const existing = await fetchPreferencesRow(accessToken, me.id);

  const targetUrl = existing
    ? `${DIRECTUS_URL}/items/user_preferences/${existing.id}`
    : `${DIRECTUS_URL}/items/user_preferences`;
  const method = existing ? "PATCH" : "POST";
  const payload = existing
    ? { preferred_practitioner: value }
    : { user: me.id, preferred_practitioner: value };

  const writeRes = await fetch(targetUrl, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!writeRes.ok) {
    const error = await writeRes.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ error: error?.errors?.[0]?.message || "Failed to update preferences" }),
      { status: writeRes.status, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }

  const result = await writeRes.json();
  return new Response(
    JSON.stringify({ success: true, preferences: { preferred_practitioner: result?.data?.preferred_practitioner ?? null } }),
    { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } }
  );
};
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
cd astro && npm run test -- preferences
```

Expected: 7/7 PASS.

- [ ] **Step 5: Commit**

```bash
git add astro/src/pages/api/auth/preferences.ts astro/__tests__/api/preferences.test.ts
git commit -m "feat(auth): preferences endpoint with upsert"
```

---

### Task 8: POST/DELETE `/api/auth/avatar`

**Files:**
- Create: `astro/src/pages/api/auth/avatar.ts`
- Create: `astro/__tests__/api/avatar.test.ts`

- [ ] **Step 1: Write the failing tests**

File: `astro/__tests__/api/avatar.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildRequest, mockFetch, emptyLocals } from "./_helpers";
import { POST, DELETE } from "../../src/pages/api/auth/avatar";

function makeFile(name: string, type: string, sizeBytes: number): File {
  const data = new Uint8Array(sizeBytes);
  return new File([data], name, { type });
}

describe("POST /api/auth/avatar", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("rejects without CSRF", async () => {
    const fd = new FormData();
    fd.append("file", makeFile("a.jpg", "image/jpeg", 100));
    const req = buildRequest({ method: "POST", bodyFormData: fd, csrf: false });
    const res = await POST({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(403);
  });

  it("rejects when not authenticated", async () => {
    const fd = new FormData();
    fd.append("file", makeFile("a.jpg", "image/jpeg", 100));
    const req = buildRequest({ method: "POST", bodyFormData: fd, accessToken: null });
    const res = await POST({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(401);
  });

  it("rejects unsupported MIME type", async () => {
    const fd = new FormData();
    fd.append("file", makeFile("a.pdf", "application/pdf", 100));
    const req = buildRequest({ method: "POST", bodyFormData: fd });
    const res = await POST({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(415);
  });

  it("rejects oversized file", async () => {
    const fd = new FormData();
    fd.append("file", makeFile("big.jpg", "image/jpeg", 3 * 1024 * 1024));
    const req = buildRequest({ method: "POST", bodyFormData: fd });
    const res = await POST({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(413);
  });

  it("uploads and sets avatar on happy path", async () => {
    // 1: POST /files → file id
    // 2: PATCH /users/me → ok
    mockFetch([
      { status: 200, body: { data: { id: "file-123" } } },
      { status: 200, body: { data: { id: "u1", avatar: "file-123" } } },
    ]);
    const fd = new FormData();
    fd.append("file", makeFile("a.jpg", "image/jpeg", 1024));
    const req = buildRequest({ method: "POST", bodyFormData: fd });
    const res = await POST({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.avatar).toBe("file-123");
  });
});

describe("DELETE /api/auth/avatar", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("clears the avatar field", async () => {
    mockFetch([{ status: 200, body: { data: { id: "u1", avatar: null } } }]);
    const req = buildRequest({ method: "DELETE" });
    const res = await DELETE({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
cd astro && npm run test -- avatar
```

Expected: import error.

- [ ] **Step 3: Write the endpoint**

File: `astro/src/pages/api/auth/avatar.ts`:

```ts
/**
 * POST   /api/auth/avatar  → upload + set avatar (multipart)
 * DELETE /api/auth/avatar  → clear avatar (file is left in Directus storage)
 */
import type { APIRoute } from "astro";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { getRequestAccessToken } from "@/lib/auth-server";

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export const POST: APIRoute = async ({ request, locals }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:avatar:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const accessToken = getRequestAccessToken(request, locals);
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid form data." }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: "Missing 'file' field." }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return new Response(
      JSON.stringify({ error: "Unsupported file type. Use JPEG, PNG, or WebP." }),
      { status: 415, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }
  if (file.size > MAX_BYTES) {
    return new Response(JSON.stringify({ error: "File too large (max 2MB)." }), {
      status: 413,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  // Upload to Directus /files
  const upload = new FormData();
  upload.append("file", file, file.name);
  const uploadRes = await fetch(`${DIRECTUS_URL}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: upload,
  });
  if (!uploadRes.ok) {
    const error = await uploadRes.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ error: error?.errors?.[0]?.message || "Upload failed" }),
      { status: uploadRes.status, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }
  const uploadJson = await uploadRes.json();
  const fileId = uploadJson?.data?.id;
  if (!fileId) {
    return new Response(JSON.stringify({ error: "Upload returned no file id." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  // Set on user
  const patchRes = await fetch(`${DIRECTUS_URL}/users/me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ avatar: fileId }),
  });
  if (!patchRes.ok) {
    const error = await patchRes.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ error: error?.errors?.[0]?.message || "Failed to set avatar" }),
      { status: patchRes.status, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }

  return new Response(JSON.stringify({ success: true, avatar: fileId }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...rlHeaders },
  });
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`auth:avatar:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const accessToken = getRequestAccessToken(request, locals);
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const patchRes = await fetch(`${DIRECTUS_URL}/users/me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ avatar: null }),
  });
  if (!patchRes.ok) {
    const error = await patchRes.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ error: error?.errors?.[0]?.message || "Failed to clear avatar" }),
      { status: patchRes.status, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...rlHeaders },
  });
};
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
cd astro && npm run test -- avatar
```

Expected: 6/6 PASS.

- [ ] **Step 5: Commit**

```bash
git add astro/src/pages/api/auth/avatar.ts astro/__tests__/api/avatar.test.ts
git commit -m "feat(auth): avatar upload + delete endpoints"
```

---

### Task 9: POST `/api/auth/resend-verification`

**Files:**
- Create: `astro/src/pages/api/auth/resend-verification.ts`
- Create: `astro/__tests__/api/resend-verification.test.ts`

- [ ] **Step 1: Write the failing tests**

File: `astro/__tests__/api/resend-verification.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildRequest, mockFetch, emptyLocals } from "./_helpers";
import { POST } from "../../src/pages/api/auth/resend-verification";

describe("POST /api/auth/resend-verification", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("rejects without CSRF", async () => {
    const req = buildRequest({ method: "POST", csrf: false });
    const res = await POST({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(403);
  });

  it("rejects when not authenticated", async () => {
    const req = buildRequest({ method: "POST", accessToken: null });
    const res = await POST({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(401);
  });

  it("rejects an already-verified user", async () => {
    mockFetch([
      { status: 200, body: { data: { id: "u1", email_verified: true } } },
    ]);
    const req = buildRequest({ method: "POST" });
    const res = await POST({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(400);
  });

  it("calls the directus extension on happy path", async () => {
    const spy = mockFetch([
      { status: 200, body: { data: { id: "u1", email_verified: false } } },
      { status: 200, body: { success: true } },
    ]);
    const req = buildRequest({ method: "POST" });
    const res = await POST({ request: req, locals: emptyLocals } as any);
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledTimes(2);
    // Second call should hit /auth-resend-verify
    expect(spy.mock.calls[1][0]).toMatch(/\/auth-resend-verify$/);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
cd astro && npm run test -- resend-verification
```

Expected: import error.

- [ ] **Step 3: Write the endpoint**

File: `astro/src/pages/api/auth/resend-verification.ts`:

```ts
/**
 * POST /api/auth/resend-verification
 * Asks the auth-resend-verify Directus extension to email a fresh
 * verification link to the current user.
 */
import type { APIRoute } from "astro";
import { checkRateLimit, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { getRequestAccessToken } from "@/lib/auth-server";

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";

export const POST: APIRoute = async ({ request, locals }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const accessToken = getRequestAccessToken(request, locals);
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Look up user to get id (for per-user rate limit) and verified status
  const meRes = await fetch(`${DIRECTUS_URL}/users/me?fields=id,email_verified`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meRes.ok) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const me = (await meRes.json())?.data;
  if (!me) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (me.email_verified) {
    return new Response(JSON.stringify({ error: "Email already verified" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Per-user rate limit (3 / hour)
  const rl = checkRateLimit(`verification:${me.id}`, RATE_LIMITS.verification);
  const rlHeaders = createRateLimitHeaders(rl);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const extRes = await fetch(`${DIRECTUS_URL}/auth-resend-verify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!extRes.ok) {
    const error = await extRes.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ error: error?.error || "Failed to send verification email" }),
      { status: extRes.status, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...rlHeaders },
  });
};
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
cd astro && npm run test -- resend-verification
```

Expected: 4/4 PASS.

- [ ] **Step 5: Commit**

```bash
git add astro/src/pages/api/auth/resend-verification.ts astro/__tests__/api/resend-verification.test.ts
git commit -m "feat(auth): resend-verification endpoint"
```

---

### Task 10: Extend `getCurrentUser` to include `email_verified`

**Files:**
- Modify: `astro/src/lib/auth.ts`

The React island needs to know `email_verified` to show the verification section. Currently `getCurrentUser` doesn't fetch it.

- [ ] **Step 1: Inspect current `getCurrentUser`**

```bash
grep -n "fields=" astro/src/lib/auth.ts
```

Expected: a line referencing `fields=id,first_name,last_name,email,avatar,role.id,role.name`.

- [ ] **Step 2: Add `email_verified` to the field list**

In `astro/src/lib/auth.ts`, change the `fields=` query in `getCurrentUser`:

```ts
const response = await fetch(`${DIRECTUS_URL}/users/me?fields=id,first_name,last_name,email,email_verified,avatar,role.id,role.name`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

- [ ] **Step 3: Update the `DirectusUser` type if needed**

```bash
grep -n "DirectusUser" astro/src/lib/directus.ts
```

If the type doesn't have `email_verified?: boolean`, add it:

```ts
// in the DirectusUser interface
email_verified?: boolean;
```

- [ ] **Step 4: Verify typecheck**

```bash
cd astro && npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add astro/src/lib/auth.ts astro/src/lib/directus.ts
git commit -m "feat(auth): expose email_verified on current user"
```

---

## Phase 3: React island

### Task 11: ProfilePanel shell with auth states

**Files:**
- Create: `astro/src/components/profile/ProfilePanel.tsx`

This task wires the shell only — placeholders for the five subsections, but no real subsections yet (Tasks 12–16 add them).

- [ ] **Step 1: Write ProfilePanel**

File: `astro/src/components/profile/ProfilePanel.tsx`:

```tsx
import { useEffect, useState, useCallback } from "react";

export interface ProfileUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  email_verified?: boolean;
  avatar?: string | null;
  role?: { id: string; name?: string };
}

type LoadState = "loading" | "unauth" | "authed" | "session-expired";

export default function ProfilePanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [user, setUser] = useState<ProfileUser | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (!data.user) {
        setState("unauth");
        setUser(null);
        return;
      }
      setUser(data.user);
      setState("authed");
    } catch {
      setState("unauth");
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Global handler that subsections call when they get a 401.
  const onSessionExpired = useCallback(() => {
    setState("session-expired");
    setTimeout(() => {
      window.location.href = "/login";
    }, 2000);
  }, []);

  if (state === "loading") {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-8 h-8 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (state === "unauth") {
    return (
      <div className="bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6 text-center">
        <p className="text-gray-600 dark:text-earth-300">Please sign in to manage your profile.</p>
        <a href="/login" className="inline-block mt-4 px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition">
          Sign In
        </a>
      </div>
    );
  }

  if (state === "session-expired") {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
        <p className="text-amber-800 dark:text-amber-200">Session expired — redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 dark:text-earth-400">
        Signed in as <span className="font-medium">{user?.email}</span>
      </p>
      {/* Subsections inserted in Tasks 12–16. */}
      {user && (
        <>
          {/* Placeholder slots — will be replaced. */}
          <SectionPlaceholder name="Identity" />
          <SectionPlaceholder name="Password" />
          <SectionPlaceholder name="Avatar" />
          <SectionPlaceholder name="Preferred practitioner" />
          <SectionPlaceholder name="Email verification" />
        </>
      )}
    </div>
  );
}

function SectionPlaceholder({ name }: { name: string }) {
  return (
    <section className="bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6 shadow-sm">
      <h2 className="font-semibold text-gray-900 dark:text-earth-100">{name}</h2>
      <p className="text-xs text-gray-400 mt-1">(placeholder)</p>
    </section>
  );
}
```

- [ ] **Step 2: Mount ProfilePanel on the page**

Replace `astro/src/pages/profile.astro` entirely:

```astro
---
import ContentLayout from "@/layouts/ContentLayout.astro";
import ProfilePanel from "@/components/profile/ProfilePanel";
---

<ContentLayout title="Profile — Verscienta Health" description="Manage your Verscienta Health account settings.">
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="font-serif text-3xl font-bold text-gray-900 dark:text-earth-100 mb-8">Your Profile</h1>
    <ProfilePanel client:load />
  </div>
</ContentLayout>
```

- [ ] **Step 3: Smoke test**

```bash
cd astro && npm run dev
```

Open `http://localhost:4321/profile`. Expected:
- If logged out: "Please sign in" panel.
- If logged in: list of five placeholder cards.

- [ ] **Step 4: Commit**

```bash
git add astro/src/components/profile/ProfilePanel.tsx astro/src/pages/profile.astro
git commit -m "feat(profile): React island shell with auth states"
```

---

### Task 12: IdentitySection

**Files:**
- Create: `astro/src/components/profile/IdentitySection.tsx`
- Modify: `astro/src/components/profile/ProfilePanel.tsx`

- [ ] **Step 1: Write the component**

File: `astro/src/components/profile/IdentitySection.tsx`:

```tsx
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ProfileUser } from "./ProfilePanel";

interface Props {
  user: ProfileUser;
  refreshUser: () => Promise<void>;
  onSessionExpired: () => void;
}

type Status = "idle" | "saving" | "success" | "error";

export default function IdentitySection({ user, refreshUser, onSessionExpired }: Props) {
  const [firstName, setFirstName] = useState(user.first_name ?? "");
  const [lastName, setLastName] = useState(user.last_name ?? "");
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  const emailChanged = email !== user.email;

  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => setStatus("idle"), 3000);
    return () => clearTimeout(t);
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setMessage("");

    const payload: Record<string, string> = {};
    if (firstName !== (user.first_name ?? "")) payload.first_name = firstName;
    if (lastName !== (user.last_name ?? "")) payload.last_name = lastName;
    if (emailChanged) {
      payload.email = email;
      payload.current_password = currentPassword;
    }
    if (Object.keys(payload).length === 0) {
      setStatus("idle");
      return;
    }

    try {
      const res = await apiFetch("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        onSessionExpired();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to save.");
        return;
      }
      await refreshUser();
      setCurrentPassword("");
      setStatus("success");
      setMessage("Saved.");
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  };

  return (
    <section className="bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6 shadow-sm">
      <h2 className="font-semibold text-gray-900 dark:text-earth-100 mb-4">Identity</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs font-medium text-gray-600 dark:text-earth-400 mb-1">First name</span>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-gray-600 dark:text-earth-400 mb-1">Last name</span>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500"
            />
          </label>
        </div>
        <label className="block">
          <span className="block text-xs font-medium text-gray-600 dark:text-earth-400 mb-1">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500"
          />
          <p className="text-xs text-gray-500 dark:text-earth-400 mt-1">
            You'll need to use this email to sign in.
          </p>
        </label>
        {emailChanged && (
          <label className="block">
            <span className="block text-xs font-medium text-gray-600 dark:text-earth-400 mb-1">
              Current password (required to change email)
            </span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500"
            />
          </label>
        )}
        {message && (
          <p
            className={`text-sm rounded-lg p-2 ${
              status === "error"
                ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
            }`}
          >
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={status === "saving"}
          className="px-4 py-2 text-sm bg-sage-600 hover:bg-sage-700 disabled:opacity-50 text-white rounded-lg transition"
        >
          {status === "saving" ? "Saving…" : "Save name"}
        </button>
      </form>
    </section>
  );
}
```

- [ ] **Step 2: Wire it into ProfilePanel**

In `astro/src/components/profile/ProfilePanel.tsx`, add the import:

```tsx
import IdentitySection from "./IdentitySection";
```

Replace the `<SectionPlaceholder name="Identity" />` with:

```tsx
<IdentitySection user={user} refreshUser={refreshUser} onSessionExpired={onSessionExpired} />
```

- [ ] **Step 3: Smoke test**

`npm run dev` in `astro/`, visit `/profile` while logged in. Change first name → click Save → see "Saved." → reload page → still saved.

- [ ] **Step 4: Commit**

```bash
git add astro/src/components/profile/IdentitySection.tsx astro/src/components/profile/ProfilePanel.tsx
git commit -m "feat(profile): IdentitySection with email-change gate"
```

---

### Task 13: PasswordSection

**Files:**
- Create: `astro/src/components/profile/PasswordSection.tsx`
- Modify: `astro/src/components/profile/ProfilePanel.tsx`

- [ ] **Step 1: Write the component**

File: `astro/src/components/profile/PasswordSection.tsx`:

```tsx
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

interface Props {
  onSessionExpired: () => void;
}

type Status = "idle" | "saving" | "success" | "error";

export default function PasswordSection({ onSessionExpired }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => setStatus("idle"), 3000);
    return () => clearTimeout(t);
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (newPassword.length < 8) {
      setStatus("error");
      setMessage("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setStatus("error");
      setMessage("New passwords don't match.");
      return;
    }

    setStatus("saving");
    try {
      const res = await apiFetch("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ password: newPassword, current_password: currentPassword }),
      });
      if (res.status === 401) {
        const data = await res.json();
        if (data.error?.match(/incorrect/i)) {
          setStatus("error");
          setMessage("Current password is incorrect.");
          return;
        }
        onSessionExpired();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to update password.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setStatus("success");
      setMessage("Password updated.");
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  };

  return (
    <section className="bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6 shadow-sm">
      <h2 className="font-semibold text-gray-900 dark:text-earth-100 mb-4">Password</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="block text-xs font-medium text-gray-600 dark:text-earth-400 mb-1">Current password</span>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500" />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-gray-600 dark:text-earth-400 mb-1">New password</span>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500" />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-gray-600 dark:text-earth-400 mb-1">Confirm new password</span>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500" />
        </label>
        {message && (
          <p className={`text-sm rounded-lg p-2 ${
              status === "error"
                ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
            }`}>
            {message}
          </p>
        )}
        <button type="submit" disabled={status === "saving"}
          className="px-4 py-2 text-sm bg-sage-600 hover:bg-sage-700 disabled:opacity-50 text-white rounded-lg transition">
          {status === "saving" ? "Updating…" : "Update password"}
        </button>
      </form>
    </section>
  );
}
```

- [ ] **Step 2: Wire it into ProfilePanel**

Add import:
```tsx
import PasswordSection from "./PasswordSection";
```

Replace the password placeholder with:
```tsx
<PasswordSection onSessionExpired={onSessionExpired} />
```

- [ ] **Step 3: Smoke test**

Visit `/profile`, change password with current password supplied → success → log out → log back in with new password.

- [ ] **Step 4: Commit**

```bash
git add astro/src/components/profile/PasswordSection.tsx astro/src/components/profile/ProfilePanel.tsx
git commit -m "feat(profile): PasswordSection"
```

---

### Task 14: AvatarSection

**Files:**
- Create: `astro/src/components/profile/AvatarSection.tsx`
- Modify: `astro/src/components/profile/ProfilePanel.tsx`

- [ ] **Step 1: Write the component**

File: `astro/src/components/profile/AvatarSection.tsx`:

```tsx
import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import { imageUrl } from "@/lib/image-url";
import type { ProfileUser } from "./ProfilePanel";

interface Props {
  user: ProfileUser;
  refreshUser: () => Promise<void>;
  onSessionExpired: () => void;
}

type Status = "idle" | "saving" | "success" | "error";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

export default function AvatarSection({ user, refreshUser, onSessionExpired }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => setStatus("idle"), 3000);
    return () => clearTimeout(t);
  }, [status]);

  const upload = async (file: File) => {
    setMessage("");
    if (!ALLOWED.includes(file.type)) {
      setStatus("error");
      setMessage("Use JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus("error");
      setMessage("File too large (max 2MB).");
      return;
    }
    setStatus("saving");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await apiFetch("/api/auth/avatar", { method: "POST", body: fd });
      if (res.status === 401) { onSessionExpired(); return; }
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Upload failed.");
        return;
      }
      await refreshUser();
      setStatus("success");
      setMessage("Avatar updated.");
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  };

  const remove = async () => {
    setMessage("");
    setStatus("saving");
    try {
      const res = await apiFetch("/api/auth/avatar", { method: "DELETE" });
      if (res.status === 401) { onSessionExpired(); return; }
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to remove.");
        return;
      }
      await refreshUser();
      setStatus("success");
      setMessage("Avatar removed.");
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <section className="bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6 shadow-sm">
      <h2 className="font-semibold text-gray-900 dark:text-earth-100 mb-4">Avatar</h2>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-earth-100 dark:bg-earth-800 flex items-center justify-center">
          {user.avatar ? (
            <img src={imageUrl(user.avatar, { width: 160, height: 160 })} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl text-earth-400">{(user.first_name?.[0] || user.email[0] || "?").toUpperCase()}</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={inputRef} type="file" accept={ALLOWED.join(",")} onChange={handleFile} className="hidden" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={status === "saving"}
            className="px-3 py-1.5 text-sm bg-sage-600 hover:bg-sage-700 disabled:opacity-50 text-white rounded-lg transition"
          >
            {user.avatar ? "Change photo" : "Upload photo"}
          </button>
          {user.avatar && (
            <button
              type="button"
              onClick={remove}
              disabled={status === "saving"}
              className="px-3 py-1.5 text-sm border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 rounded-lg transition"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {message && (
        <p className={`mt-3 text-sm rounded-lg p-2 ${
            status === "error"
              ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
              : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
          }`}>
          {message}
        </p>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Wire into ProfilePanel**

Add import:
```tsx
import AvatarSection from "./AvatarSection";
```

Replace the avatar placeholder with:
```tsx
<AvatarSection user={user} refreshUser={refreshUser} onSessionExpired={onSessionExpired} />
```

- [ ] **Step 3: Smoke test**

Upload a 500KB JPEG → see thumbnail. Try a `.pdf` → see "Use JPEG, PNG, or WebP." Try 5MB JPEG → see "File too large".

- [ ] **Step 4: Commit**

```bash
git add astro/src/components/profile/AvatarSection.tsx astro/src/components/profile/ProfilePanel.tsx
git commit -m "feat(profile): AvatarSection"
```

---

### Task 15: PreferredPractitionerSection

**Files:**
- Create: `astro/src/components/profile/PreferredPractitionerSection.tsx`
- Modify: `astro/src/components/profile/ProfilePanel.tsx`

- [ ] **Step 1: Write the component**

File: `astro/src/components/profile/PreferredPractitionerSection.tsx`:

```tsx
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

interface Props {
  onSessionExpired: () => void;
}

interface Practitioner {
  id: string;
  first_name?: string;
  last_name?: string;
}

type Status = "loading" | "idle" | "saving" | "error";

export default function PreferredPractitionerSection({ onSessionExpired }: Props) {
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/preferences");
        if (res.status === 401) { onSessionExpired(); return; }
        const data = await res.json();
        setPractitioner(data.preferred_practitioner ?? null);
        setStatus("idle");
      } catch {
        setStatus("error");
        setMessage("Couldn't load preferences.");
      }
    })();
  }, [onSessionExpired]);

  const remove = async () => {
    setMessage("");
    setStatus("saving");
    try {
      const res = await apiFetch("/api/auth/preferences", {
        method: "PATCH",
        body: JSON.stringify({ preferred_practitioner: null }),
      });
      if (res.status === 401) { onSessionExpired(); return; }
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to remove.");
        return;
      }
      setPractitioner(null);
      setStatus("idle");
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  };

  const fullName = practitioner
    ? [practitioner.first_name, practitioner.last_name].filter(Boolean).join(" ") || "Practitioner"
    : null;

  return (
    <section className="bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6 shadow-sm">
      <h2 className="font-semibold text-gray-900 dark:text-earth-100 mb-4">My practitioner</h2>
      {status === "loading" ? (
        <p className="text-sm text-gray-500 dark:text-earth-400">Loading…</p>
      ) : practitioner ? (
        <div className="flex items-center justify-between p-3 bg-sage-50 dark:bg-sage-900/20 rounded-lg">
          <span className="text-sm font-medium text-sage-800 dark:text-sage-200">{fullName}</span>
          <button
            onClick={remove}
            disabled={status === "saving"}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-earth-400">
          No preferred practitioner set.{" "}
          <a href="/practitioners" className="text-sage-600 hover:underline">Browse practitioners →</a>
        </p>
      )}
      {message && (
        <p className="mt-3 text-sm rounded-lg p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          {message}
        </p>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Wire into ProfilePanel**

Add import:
```tsx
import PreferredPractitionerSection from "./PreferredPractitionerSection";
```

Replace the placeholder with:
```tsx
<PreferredPractitionerSection onSessionExpired={onSessionExpired} />
```

- [ ] **Step 3: Smoke test (manual)**

Cannot fully test until Task 17 ("Set as my practitioner" button) is built. For now: visit `/profile` → see "No preferred practitioner set" message. (Setting one happens via Task 17.)

- [ ] **Step 4: Commit**

```bash
git add astro/src/components/profile/PreferredPractitionerSection.tsx astro/src/components/profile/ProfilePanel.tsx
git commit -m "feat(profile): PreferredPractitionerSection"
```

---

### Task 16: EmailVerificationSection

**Files:**
- Create: `astro/src/components/profile/EmailVerificationSection.tsx`
- Modify: `astro/src/components/profile/ProfilePanel.tsx`

- [ ] **Step 1: Write the component**

File: `astro/src/components/profile/EmailVerificationSection.tsx`:

```tsx
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ProfileUser } from "./ProfilePanel";

interface Props {
  user: ProfileUser;
  onSessionExpired: () => void;
}

type Status = "idle" | "sending" | "sent" | "error";

export default function EmailVerificationSection({ user, onSessionExpired }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (user.email_verified) {
    return (
      <section className="bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-earth-100 mb-2">Email verification</h2>
        <p className="text-sm text-green-700 dark:text-green-300 inline-flex items-center gap-1">
          <span>✓</span>
          <span>Verified</span>
        </p>
      </section>
    );
  }

  const resend = async () => {
    setStatus("sending");
    setMessage("");
    try {
      const res = await apiFetch("/api/auth/resend-verification", { method: "POST" });
      if (res.status === 401) { onSessionExpired(); return; }
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to send.");
        return;
      }
      setStatus("sent");
      setMessage("If your email isn't verified, we sent a new link.");
      setCooldown(60);
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  };

  return (
    <section className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
      <h2 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Email verification</h2>
      <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
        Please verify your email address to unlock all features.
      </p>
      <button
        onClick={resend}
        disabled={status === "sending" || cooldown > 0}
        className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition"
      >
        {cooldown > 0 ? `Sent — wait ${cooldown}s` : status === "sending" ? "Sending…" : "Resend verification email"}
      </button>
      {message && (
        <p className={`mt-3 text-sm ${status === "error" ? "text-red-700 dark:text-red-300" : "text-amber-800 dark:text-amber-200"}`}>
          {message}
        </p>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Wire into ProfilePanel**

Add import:
```tsx
import EmailVerificationSection from "./EmailVerificationSection";
```

Replace the placeholder with:
```tsx
<EmailVerificationSection user={user} onSessionExpired={onSessionExpired} />
```

- [ ] **Step 3: Smoke test**

For an unverified user: visit `/profile` → see amber banner with Resend button. Click → button disables for 60s.

- [ ] **Step 4: Commit**

```bash
git add astro/src/components/profile/EmailVerificationSection.tsx astro/src/components/profile/ProfilePanel.tsx
git commit -m "feat(profile): EmailVerificationSection"
```

---

## Phase 4: Practitioner detail page button + dashboard cleanup

### Task 17: "Set as my practitioner" button on practitioner detail page

**Files:**
- Create: `astro/src/components/profile/SetAsMyPractitionerButton.tsx`
- Modify: `astro/src/pages/practitioners/[id].astro`

- [ ] **Step 1: Write the component**

File: `astro/src/components/profile/SetAsMyPractitionerButton.tsx`:

```tsx
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

interface Props {
  practitionerId: string;
}

type Status = "loading" | "logged-out" | "idle" | "saving" | "set" | "error";

export default function SetAsMyPractitionerButton({ practitionerId }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.user) { setStatus("logged-out"); return; }
        // Check if already preferred
        const prefRes = await fetch("/api/auth/preferences");
        const prefData = await prefRes.json();
        if (prefData.preferred_practitioner?.id === practitionerId) {
          setStatus("set");
        } else {
          setStatus("idle");
        }
      } catch {
        setStatus("logged-out");
      }
    })();
  }, [practitionerId]);

  const handleClick = async () => {
    setStatus("saving");
    setMessage("");
    try {
      const res = await apiFetch("/api/auth/preferences", {
        method: "PATCH",
        body: JSON.stringify({ preferred_practitioner: practitionerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to save.");
        return;
      }
      setStatus("set");
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  };

  if (status === "loading" || status === "logged-out") return null;

  if (status === "set") {
    return (
      <div className="inline-flex items-center gap-1 text-sm text-sage-700 dark:text-sage-300">
        <span>✓</span>
        <span>Set as your practitioner</span>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        onClick={handleClick}
        disabled={status === "saving"}
        className="px-3 py-1.5 text-sm bg-sage-600 hover:bg-sage-700 disabled:opacity-50 text-white rounded-lg transition"
      >
        {status === "saving" ? "Saving…" : "Set as my practitioner"}
      </button>
      {message && <p className="text-xs text-red-600">{message}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Mount it on the practitioner detail page**

In `astro/src/pages/practitioners/[id].astro`, add an import in the frontmatter:

```astro
---
import SetAsMyPractitionerButton from "@/components/profile/SetAsMyPractitionerButton";
// ... existing imports
---
```

Find a good spot in the body (near the practitioner name, or alongside "Contact" CTAs) and add:

```astro
<SetAsMyPractitionerButton client:load practitionerId={practitioner.id} />
```

If unsure where, place it just below the breadcrumbs and before the practitioner name. The button hides itself for logged-out users, so it's safe to render unconditionally.

- [ ] **Step 3: Smoke test**

Logged-in: visit any practitioner page → click button → see "✓ Set as your practitioner" → visit `/profile` → confirm shown there.
Logged-out: visit same page → button is invisible (renders nothing).

- [ ] **Step 4: Commit**

```bash
git add astro/src/components/profile/SetAsMyPractitionerButton.tsx astro/src/pages/practitioners/[id].astro
git commit -m "feat(practitioners): set-as-my-practitioner button"
```

---

### Task 18: Dashboard cleanup

**Files:**
- Modify: `astro/src/pages/dashboard.astro`

- [ ] **Step 1: Remove the "Change Password" card and its handler**

In `astro/src/pages/dashboard.astro`:

1. Delete the entire `<!-- Change Password -->` div (the form card with `id="change-password-form"`).
2. In the `<script>` block, delete the entire `// ── Change Password ──` block including the event listener.

- [ ] **Step 2: Remove the "My Practitioner" card**

Delete the entire `<!-- Preferred Practitioner -->` div (the card with `id="preferred-practitioner-display"`).

- [ ] **Step 3: Add "Manage your profile" link**

Replace the now-mostly-empty "Account Management Section" header and grid with a single profile-link card:

```astro
<!-- Account Management Section -->
<h2 class="text-lg font-semibold text-gray-900 dark:text-earth-100 mb-4">Account</h2>
<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
  <a href="/profile" class="group p-5 bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 shadow-sm hover:shadow-md transition-all">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-sage-100 dark:bg-sage-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      </div>
      <div>
        <h3 class="font-semibold text-gray-900 dark:text-earth-100 group-hover:text-sage-600">Manage your profile</h3>
        <p class="text-xs text-gray-500 dark:text-earth-400">Identity, password, avatar, preferences</p>
      </div>
    </div>
  </a>

  <!-- Newsletter & Theme cards stay here for now (deferred to follow-up). -->
  <div class="space-y-6">
    <!-- Newsletter signup card — keep existing -->
    <!-- Theme preference card — keep existing -->
  </div>
</div>
```

(Keep the existing Newsletter and Theme card markup inside the right-hand `<div class="space-y-6">` — only the change-password and preferred-practitioner cards are deleted.)

- [ ] **Step 4: Smoke test**

Visit `/dashboard` while logged in. Expected:
- "Manage your profile" card visible.
- No change-password form.
- No preferred-practitioner card.
- Newsletter and theme toggles still work.
- Sign Out still works.

- [ ] **Step 5: Commit**

```bash
git add astro/src/pages/dashboard.astro
git commit -m "refactor(dashboard): move account management to /profile"
```

---

## Phase 5: End-to-end tests

### Task 19: Playwright fixtures

**Files:**
- Create: `astro/e2e/fixtures/users.ts`

The Playwright config already exists at `astro/playwright.config.ts` and points at `./e2e`. We need a way to create + cleanup test users.

- [ ] **Step 1: Write the fixture helpers**

File: `astro/e2e/fixtures/users.ts`:

```ts
/**
 * Test user creation helpers for Playwright.
 * Uses the Directus admin token (DIRECTUS_TOKEN env var) to create + clean up users.
 */
const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

const PATIENT_ROLE_ID = "2f72336d-c7d5-4c8d-a127-301f687db060";

export interface TestUser {
  id: string;
  email: string;
  password: string;
  cleanup: () => Promise<void>;
}

export async function createTestUser({ verified = true }: { verified?: boolean } = {}): Promise<TestUser> {
  if (!DIRECTUS_TOKEN) throw new Error("DIRECTUS_TOKEN env var required for E2E tests.");
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;
  const password = "TestPass123!";

  const res = await fetch(`${DIRECTUS_URL}/users`, {
    method: "POST",
    headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      first_name: "E2E",
      last_name: "Test",
      role: PATIENT_ROLE_ID,
      email_verified: verified,
      status: "active",
    }),
  });
  if (!res.ok) throw new Error(`Failed to create test user: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const id = json.data.id;

  return {
    id,
    email,
    password,
    cleanup: async () => {
      await fetch(`${DIRECTUS_URL}/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
      });
    },
  };
}
```

- [ ] **Step 2: Verify it typechecks**

```bash
cd astro && npx tsc --noEmit e2e/fixtures/users.ts
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add astro/e2e/fixtures/users.ts
git commit -m "test(e2e): test user fixture helpers"
```

---

### Task 20: Playwright E2E for the profile page

**Files:**
- Create: `astro/e2e/profile.spec.ts`

- [ ] **Step 1: Write the E2E spec**

File: `astro/e2e/profile.spec.ts`:

```ts
import { test, expect } from "@playwright/test";
import { createTestUser, type TestUser } from "./fixtures/users";

let user: TestUser;

test.beforeEach(async ({ page }) => {
  user = await createTestUser({ verified: true });
  // Sign in
  await page.goto("/login");
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
});

test.afterEach(async () => {
  await user.cleanup();
});

test("redirects unauthenticated users", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/profile");
  await expect(page.getByText(/please sign in/i)).toBeVisible();
});

test("changes first name and reflects on dashboard greeting", async ({ page }) => {
  await page.goto("/profile");
  await page.fill('input[type="text"]:near(:text("First name"))', "Alice");
  await page.click('button:has-text("Save name")');
  await expect(page.getByText(/saved/i)).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByText(/welcome back, alice/i)).toBeVisible();
});

test("rejects oversized avatar with friendly error", async ({ page }) => {
  await page.goto("/profile");
  // Inject a 3MB blob via the file input
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles({
    name: "big.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.alloc(3 * 1024 * 1024),
  });
  await expect(page.getByText(/file too large/i)).toBeVisible();
});

test("set-as-my-practitioner button updates profile", async ({ page }) => {
  // Visit any practitioner page (rely on at least one practitioner existing in dev DB)
  await page.goto("/practitioners");
  const firstLink = page.locator('a[href^="/practitioners/"]').first();
  await firstLink.click();
  await page.click('button:has-text("Set as my practitioner")');
  await expect(page.getByText(/set as your practitioner/i)).toBeVisible();
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: /my practitioner/i })).toBeVisible();
  await expect(page.locator('text=Remove')).toBeVisible();
});
```

- [ ] **Step 2: Run E2E**

Make sure local Directus is up and `astro` dev server can start. Then:

```bash
cd astro && DIRECTUS_TOKEN=<your-local-admin-token> npm run test:e2e
```

Expected: 4/4 PASS. If "set-as-my-practitioner" fails because no practitioners exist in the dev DB, seed at least one practitioner record, or skip that test with `test.skip` and add a manual-test note.

- [ ] **Step 3: Commit**

```bash
git add astro/e2e/profile.spec.ts
git commit -m "test(e2e): profile page flows"
```

---

## Phase 6: Final verification + PR

### Task 21: Full verification + PR

- [ ] **Step 1: Run full test suite**

```bash
cd astro && npm run test
```

Expected: all Vitest tests pass.

- [ ] **Step 2: Run typecheck**

```bash
cd astro && npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Run lint**

```bash
cd astro && npm run lint
```

Expected: clean. If there are pre-existing warnings unrelated to this work, leave them; do not "fix" them in this PR.

- [ ] **Step 4: Manual smoke matrix**

Walk through the full manual matrix from the spec (section "Manual test matrix"). Tick each off in the PR description.

- [ ] **Step 5: Push and open PR**

```bash
git push -u origin claude/compassionate-gauss-e4863f
gh pr create --base main --title "feat(profile): profile management page" --body "$(cat <<'EOF'
## Summary
- New `/profile` page (React island) with five sections: identity, password, avatar, preferred practitioner, email verification.
- Current-password gate on email and password changes.
- New `user_preferences` Directus collection + `auth-resend-verify` Directus extension.
- Dashboard cleaned up — change-password and preferred-practitioner cards moved to `/profile`.
- "Set as my practitioner" button on practitioner detail pages.

See [docs/superpowers/specs/2026-05-08-profile-management-design.md](../docs/superpowers/specs/2026-05-08-profile-management-design.md).

## Pre-merge ops
- [ ] Apply Directus snapshot to prod: `npx directus schema apply directus/snapshots/2026-05-08-user-preferences.yaml` (against `https://backend.verscienta.com`).
- [ ] Rebuild + push Directus image to GHCR (so the new `auth-resend-verify` extension is in prod).
- [ ] Coolify pulls the new image.
- [ ] Spot-check role permissions in prod admin: Patient Access + Professional Access can CRUD `user_preferences` rows scoped to themselves; can PATCH `directus_users.avatar` on `/users/me`.

## Test plan
- [x] Vitest: 4 endpoint test files
- [x] Playwright: 4 E2E flows
- [ ] Manual matrix from spec — see PR comments for tick list

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 6: Confirm PR opened**

The `gh pr create` command prints a URL. Visit it, verify body rendered correctly, request reviews as appropriate.

---

## Self-review notes (read before executing)

**Spec coverage check:**
- Identity (Q2.1) → Task 6 (endpoint) + Task 12 (UI). ✓
- Password (Q2.2) → Task 6 + Task 13. ✓
- Avatar (Q2.3) → Task 8 + Task 14. ✓
- Preferred practitioner (Q2.4) → Task 7 + Task 15 + Task 17. ✓
- Email verification (Q2.9) → Task 3 (extension) + Task 9 (endpoint) + Task 16 (UI). ✓
- Current-password gate (Q5) → Task 6 (server-side). ✓
- `user_preferences` collection (Q7) → Task 1 + Task 2. ✓
- Avatar proxy + size/type validation (Q4 → B) → Task 8. ✓
- Dashboard cleanup → Task 18. ✓
- Set-as-my-practitioner button → Task 17. ✓
- Vitest tests → Tasks 6, 7, 8, 9. ✓
- Playwright tests → Task 20. ✓
- Single PR back to main → Task 21. ✓

**Type consistency check:**
- `ProfileUser` is exported from `ProfilePanel.tsx` and imported by `IdentitySection`, `AvatarSection`, `EmailVerificationSection`. ✓
- `refreshUser: () => Promise<void>` consistent across all sections that use it. ✓
- `onSessionExpired: () => void` consistent. ✓
- API response shapes used in tests match the shapes returned by endpoints. ✓

**Open implementation question (acknowledged in Task 3):** if Directus 11 has changed `email_verification_token` field name or storage, the engineer follows the documented fallback HMAC flow. This is bounded — the spec only requires "send a verification link"; the exact mechanism is implementation-resolved.
