describe('lib/cache', () => {
  let memoryCache: typeof import('@/lib/cache').memoryCache;
  let cachedFetch: typeof import('@/lib/cache').cachedFetch;
  let CACHE_TTL: typeof import('@/lib/cache').CACHE_TTL;

  beforeEach(() => {
    jest.resetModules();
    const mod = require('@/lib/cache');
    memoryCache = mod.memoryCache;
    cachedFetch = mod.cachedFetch;
    CACHE_TTL = mod.CACHE_TTL;
    memoryCache.clear();
  });

  describe('memoryCache', () => {
    it('returns null for missing keys', () => {
      expect(memoryCache.get('missing')).toBeNull();
    });

    it('stores and retrieves a value', () => {
      memoryCache.set('key1', { name: 'test' }, 60);
      expect(memoryCache.get('key1')).toEqual({ name: 'test' });
    });

    it('returns null for expired entries', () => {
      // Set with 0-second TTL (expires immediately)
      memoryCache.set('expired', 'data', 0);
      // Advance time slightly
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 1);
      expect(memoryCache.get('expired')).toBeNull();
      jest.restoreAllMocks();
    });

    it('has() returns true for live entries, false for missing', () => {
      memoryCache.set('alive', 42, 60);
      expect(memoryCache.has('alive')).toBe(true);
      expect(memoryCache.has('gone')).toBe(false);
    });

    it('delete() removes a key', () => {
      memoryCache.set('toDelete', 'val', 60);
      expect(memoryCache.has('toDelete')).toBe(true);
      memoryCache.delete('toDelete');
      expect(memoryCache.has('toDelete')).toBe(false);
    });

    it('clear() removes all entries', () => {
      memoryCache.set('a', 1, 60);
      memoryCache.set('b', 2, 60);
      expect(memoryCache.stats().size).toBe(2);
      memoryCache.clear();
      expect(memoryCache.stats().size).toBe(0);
    });

    it('stats() returns size and keys', () => {
      memoryCache.set('x', 1, 60);
      memoryCache.set('y', 2, 60);
      const stats = memoryCache.stats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('x');
      expect(stats.keys).toContain('y');
    });
  });

  describe('cachedFetch', () => {
    it('calls fetcher on cache miss', async () => {
      const fetcher = jest.fn().mockResolvedValue({ result: 'fresh' });
      const result = await cachedFetch('cfKey', fetcher, 60);
      expect(result).toEqual({ result: 'fresh' });
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('returns cached value on cache hit', async () => {
      const fetcher = jest.fn().mockResolvedValue({ result: 'fresh' });
      await cachedFetch('cfKey2', fetcher, 60);
      const result = await cachedFetch('cfKey2', fetcher, 60);
      expect(result).toEqual({ result: 'fresh' });
      expect(fetcher).toHaveBeenCalledTimes(1); // Not called again
    });
  });

  describe('CACHE_TTL constants', () => {
    it('has expected TTL values', () => {
      expect(CACHE_TTL.SHORT).toBe(30);
      expect(CACHE_TTL.MEDIUM).toBe(300);
      expect(CACHE_TTL.LONG).toBe(3600);
      expect(CACHE_TTL.FORMULAS_LIST).toBe(300);
      expect(CACHE_TTL.SIMILARITIES).toBe(600);
    });
  });
});
