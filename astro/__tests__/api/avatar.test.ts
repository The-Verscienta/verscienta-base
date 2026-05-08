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
