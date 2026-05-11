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
    expect((spy.mock.calls[1] as unknown[])[0]).toMatch(/\/auth-resend-verify$/);
  });
});
