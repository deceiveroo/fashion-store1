import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NOTE: In-memory rate limiting works only for single-instance deployments.
// For Vercel (multi-instance), upgrade to @upstash/ratelimit + Redis.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= limit) return false;
  record.count++;
  return true;
}

// Periodically clean up expired entries (lazy cleanup on each request)
function cleanupExpired() {
  const now = Date.now();
  // Only clean if map is getting large to avoid overhead on every request
  if (rateLimitMap.size < 500) return;
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) rateLimitMap.delete(key);
  }
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export function middleware(request: NextRequest) {
  cleanupExpired();

  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const isAdminApi = pathname.startsWith('/api/admin/');
    const isAuthApi = pathname.startsWith('/api/auth/');

    // Stricter limits for auth endpoints (brute-force protection)
    if (isAuthApi) {
      if (!rateLimit(`auth:${ip}`, 10, 60_000)) {
        return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        });
      }
    } else if (isAdminApi) {
      if (!rateLimit(`admin:${ip}`, 60, 60_000)) {
        return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        });
      }
    } else {
      if (!rateLimit(`api:${ip}`, 120, 60_000)) {
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
