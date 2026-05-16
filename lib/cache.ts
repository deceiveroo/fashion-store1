/**
 * Simple in-memory cache with TTL (Time To Live)
 * Used to reduce database query load for frequently accessed data
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class InMemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number; // in milliseconds

  constructor(defaultTTL: number = 60 * 1000) { // Default 1 minute
    this.defaultTTL = defaultTTL;
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get cached data by key
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiry });
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or set cache (convenience method)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();
    
    // Store in cache
    this.set(key, data, ttl);
    
    return data;
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Create singleton instance
export const cache = new InMemoryCache(60 * 1000); // 1 minute default TTL

// Export cache keys for consistency
export const CACHE_KEYS = {
  // Products
  PRODUCT_BY_ID: (id: string) => `product:${id}`,
  PRODUCTS_BY_CATEGORY: (categoryId: string) => `products:category:${categoryId}`,
  FEATURED_PRODUCTS: 'products:featured',
  NEW_PRODUCTS: 'products:new',
  
  // Categories
  ALL_CATEGORIES: 'categories:all',
  CATEGORY_BY_SLUG: (slug: string) => `category:${slug}`,
  
  // Recommendations
  SIMILAR_PRODUCTS: (productId: string) => `recommendations:similar:${productId}`,
  TRENDING_PRODUCTS: 'recommendations:trending',
  FREQUENTLY_BOUGHT: (productId: string) => `recommendations:frequently_bought:${productId}`,
  
  // User data
  USER_PROFILE: (userId: string) => `user:${userId}`,
  USER_FAVORITES: (userId: string) => `user:favorites:${userId}`,
  USER_ORDERS: (userId: string) => `user:orders:${userId}`,
  
  // Collections & Bundles
  ACTIVE_COLLECTIONS: 'collections:active',
  ACTIVE_BUNDLES: 'bundles:active',
  BUNDLE_BY_SLUG: (slug: string) => `bundle:${slug}`,
  
  // Site config
  SITE_CONFIG: 'site:config',
};

// Cache TTL presets (in milliseconds)
export const CACHE_TTL = {
  SHORT: 30 * 1000,      // 30 seconds - rapidly changing data
  MEDIUM: 60 * 1000,     // 1 minute - product data
  LONG: 5 * 60 * 1000,   // 5 minutes - categories, config
  VERY_LONG: 15 * 60 * 1000, // 15 minutes - static content
};

export default cache;
