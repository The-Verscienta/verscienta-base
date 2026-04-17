/**
 * Cache utility tests
 */
import { describe, it, expect, vi } from "vitest";
import { memoryCache, cachedFetch, CACHE_TTL } from "../../src/lib/cache";

describe("MemoryCache", () => {
  it("stores and retrieves values", () => {
    memoryCache.set("test-key", { hello: "world" }, 60);
    expect(memoryCache.get("test-key")).toEqual({ hello: "world" });
  });

  it("returns null for missing keys", () => {
    expect(memoryCache.get("nonexistent")).toBeNull();
  });

  it("expires entries after TTL", async () => {
    memoryCache.set("expire-test", "data", 0.01); // 10ms TTL
    await new Promise((r) => setTimeout(r, 20));
    expect(memoryCache.get("expire-test")).toBeNull();
  });

  it("has() returns correct boolean", () => {
    memoryCache.set("has-test", true, 60);
    expect(memoryCache.has("has-test")).toBe(true);
    expect(memoryCache.has("missing")).toBe(false);
  });

  it("delete() removes entry", () => {
    memoryCache.set("delete-test", "data", 60);
    memoryCache.delete("delete-test");
    expect(memoryCache.get("delete-test")).toBeNull();
  });

  it("stats() returns size and keys", () => {
    memoryCache.clear();
    memoryCache.set("a", 1, 60);
    memoryCache.set("b", 2, 60);
    const stats = memoryCache.stats();
    expect(stats.size).toBe(2);
    expect(stats.keys).toContain("a");
    expect(stats.keys).toContain("b");
  });
});

describe("cachedFetch", () => {
  it("calls fetcher on cache miss", async () => {
    memoryCache.clear();
    const fetcher = vi.fn().mockResolvedValue({ result: 42 });
    const result = await cachedFetch("cf-test", fetcher, 60);
    expect(result).toEqual({ result: 42 });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("returns cached value on hit", async () => {
    memoryCache.clear();
    const fetcher = vi.fn().mockResolvedValue("fresh");
    await cachedFetch("cf-hit", fetcher, 60);
    const result = await cachedFetch("cf-hit", fetcher, 60);
    expect(result).toBe("fresh");
    expect(fetcher).toHaveBeenCalledOnce();
  });
});

describe("CACHE_TTL constants", () => {
  it("has expected values", () => {
    expect(CACHE_TTL.SHORT).toBe(30);
    expect(CACHE_TTL.MEDIUM).toBe(300);
    expect(CACHE_TTL.LONG).toBe(3600);
  });
});
