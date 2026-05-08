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
