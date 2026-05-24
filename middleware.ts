import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateCSPHeader } from '@/lib/xss-protection';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis for rate limiting
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Rate limiters with Upstash (works in multi-instance Vercel deployments)
const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, '60 s'),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : null;

const authRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : null;

const authReadRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, '60 s'),
      analytics: true,
      prefix: 'ratelimit:auth-read',
    })
  : null;

const adminRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '60 s'),
      analytics: true,
      prefix: 'ratelimit:admin',
    })
  : null;

// Fallback in-memory rate limiting (for development without Redis)
const memoryRateLimit = new Map<string, { count: number; resetTime: number }>();

function memoryRateLimitCheck(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = memoryRateLimit.get(key);

  if (!record || now > record.resetTime) {
    memoryRateLimit.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= limit) return false;
  record.count++;
  return true;
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': generateCSPHeader(),
};

async function getFingerprint(ip: string, ua: string): Promise<string> {
  const data = new TextEncoder().encode(ip + ua);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

  // --- SESSION HIJACKING PROTECTION (Edge Redis-based) ---
  const tokenCookie = request.cookies.get('authjs.session-token') || 
                      request.cookies.get('__Secure-authjs.session-token') ||
                      request.cookies.get('next-auth.session-token') ||
                      request.cookies.get('__Secure-next-auth.session-token');
  const token = tokenCookie?.value;

  if (token && redis) {
    try {
      const ua = request.headers.get('user-agent') ?? '';
      const currentFingerprint = await getFingerprint(ip, ua);
      const redisKey = `session:fingerprint:${token}`;
      
      const storedFingerprint = await redis.get(redisKey) as string | null;
      
      if (!storedFingerprint) {
        // First request with this token: save fingerprint for 30 days
        await redis.setex(redisKey, 30 * 24 * 60 * 60, currentFingerprint);
      } else if (storedFingerprint !== currentFingerprint) {
        console.warn(`[SECURITY WARNING] Session hijacking attempt detected for token: ${token.slice(0, 8)}... IP: ${ip}`);
        
        // Block the request with a Forbidden response
        const errorResponse = new NextResponse(
          JSON.stringify({ 
            error: 'Security violation: Session terminated due to device or network change.' 
          }), 
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        
        // Force logout by deleting NextAuth cookies
        errorResponse.cookies.delete('authjs.session-token');
        errorResponse.cookies.delete('__Secure-authjs.session-token');
        errorResponse.cookies.delete('next-auth.session-token');
        errorResponse.cookies.delete('__Secure-next-auth.session-token');
        
        // Invalidate in Redis
        await redis.del(redisKey);
        
        return errorResponse;
      }
    } catch (secError) {
      console.error('[SECURITY MIDDLEWARE ERROR]', secError);
    }
  }

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const isAdminApi = pathname.startsWith('/api/admin/');
    const isAuthApi = pathname.startsWith('/api/auth/') || pathname.startsWith('/api/user/');
    const isAuthReadEndpoint =
      pathname === '/api/auth/session' ||
      pathname === '/api/auth/csrf' ||
      pathname === '/api/auth/providers';

    let rateLimitResult: { success: boolean } | null = null;

    // Use Upstash rate limiting if available, otherwise fallback to memory
    if (redis) {
      // Upstash rate limiting (works in multi-instance Vercel)
      if (isAuthApi) {
        const limiter = isAuthReadEndpoint ? authReadRateLimiter : authRateLimiter;
        if (limiter) {
          rateLimitResult = await limiter.limit(ip);
        }
      } else if (isAdminApi) {
        if (adminRateLimiter) {
          rateLimitResult = await adminRateLimiter.limit(ip);
        }
      } else {
        if (apiRateLimiter) {
          rateLimitResult = await apiRateLimiter.limit(ip);
        }
      }

      if (rateLimitResult && !rateLimitResult.success) {
        return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        });
      }
    } else {
      // Fallback to in-memory rate limiting (development only)
      const authLimit = isAuthReadEndpoint ? 120 : 10;
      const authWindowMs = 60_000;
      const authKeyPrefix = isAuthReadEndpoint ? 'auth-read' : 'auth';

      let allowed = true;
      if (isAuthApi) {
        allowed = memoryRateLimitCheck(`${authKeyPrefix}:${ip}`, authLimit, authWindowMs);
      } else if (isAdminApi) {
        allowed = memoryRateLimitCheck(`admin:${ip}`, 60, 60_000);
      } else {
        allowed = memoryRateLimitCheck(`api:${ip}`, 120, 60_000);
      }

      if (!allowed) {
        return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        });
      }
    }
  }

  const response = NextResponse.next();

  // Apply security headers to all responses
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
