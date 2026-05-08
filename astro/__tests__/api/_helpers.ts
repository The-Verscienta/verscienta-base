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
