/**
 * Redis Configuration for Rate Limiting and Caching
 * Uses Upstash Redis (serverless, free tier available)
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Redis client
// Falls back to in-memory if env vars not set (development mode)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;

if (redisUrl && redisToken) {
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });
  console.log('✅ Redis connected (Upstash)');
} else {
  console.warn('⚠️  Redis not configured. Using in-memory fallback.');
  console.warn('   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env');
}

// Rate limiter for chat messages (10 per minute per session)
export const chatRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 messages per 60 seconds
      analytics: true,
      prefix: 'ratelimit:chat',
    })
  : null;

// Rate limiter for admin actions (more lenient)
export const adminRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '60 s'), // 100 actions per minute
      analytics: true,
      prefix: 'ratelimit:admin',
    })
  : null;

// Generic cache helper with TTL
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;

  try {
    const data = await redis.get(key);
    return data ? (JSON.parse(data as string) as T) : null;
  } catch (error) {
    console.error('[Redis Cache] Get error:', error);
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300 // Default 5 minutes
): Promise<boolean> {
  if (!redis) return false;

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('[Redis Cache] Set error:', error);
    return false;
  }
}

export async function cacheDelete(key: string): Promise<boolean> {
  if (!redis) return false;

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('[Redis Cache] Delete error:', error);
    return false;
  }
}

// Helper to check if Redis is available
export function isRedisAvailable(): boolean {
  return redis !== null;
}

// Fallback in-memory rate limiter (for development without Redis)
const memoryRateLimit = new Map<string, { count: number; resetTime: number }>();

export function memoryRateLimitCheck(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = memoryRateLimit.get(key);

  if (!record || now > record.resetTime) {
    memoryRateLimit.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

// Cleanup expired memory records every 5 minutes
if (typeof global !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryRateLimit.entries()) {
      if (now > record.resetTime) {
        memoryRateLimit.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
