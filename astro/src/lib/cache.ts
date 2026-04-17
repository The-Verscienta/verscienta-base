/**
 * Lightweight in-memory cache with TTL support
 *
 * Ported from frontend/lib/cache.ts — identical logic.
 * Removed setInterval (not suitable for edge/serverless), uses lazy cleanup.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  stats(): { size: number; keys: string[] } {
    return { size: this.cache.size, keys: Array.from(this.cache.keys()) };
  }
}

export const memoryCache = new MemoryCache();

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = memoryCache.get<T>(key);
  if (cached !== null) return cached;

  const data = await fetcher();
  memoryCache.set(key, data, ttlSeconds);
  return data;
}

export const CACHE_TTL = {
  FORMULAS_LIST: 300,
  SIMILARITIES: 600,
  CONTRIBUTIONS: 60,
  SHORT: 30,
  MEDIUM: 300,
  LONG: 3600,
} as const;
