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
    // 1st fetch: GET /users/me → returns user with current email
    // 2nd fetch: POST /auth/login (verify) → 401
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
