// In-memory cache with TTL support
// For multi-instance production: replace with @upstash/redis

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxSize = 200;

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  async set<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): Promise<void> {
    if (this.cache.size >= this.maxSize) {
      // Evict oldest entry
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async invalidateByPrefix(prefix: string): Promise<void> {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }
}

export const cache = new MemoryCache();

export const getCached = <T>(key: string) => cache.get<T>(key);
export const setCache = <T>(key: string, data: T, ttlMs?: number) => cache.set(key, data, ttlMs);
export const invalidateCache = (key: string) => cache.delete(key);
export const invalidateCacheByPrefix = (prefix: string) => cache.invalidateByPrefix(prefix);

// TTL constants
export const TTL = {
  STATS: 2 * 60 * 1000,       // 2 min — stats change often
  ANALYTICS: 5 * 60 * 1000,   // 5 min
  PRODUCTS: 10 * 60 * 1000,   // 10 min
  CUSTOMERS: 3 * 60 * 1000,   // 3 min
} as const;
