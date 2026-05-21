import { NextRequest, NextResponse } from 'next/server';

/**
 * CSRF Protection Middleware
 * Validates Origin and Referer headers for state-changing requests
 */

// Allowed origins for CSRF validation
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean) as string[];

export function validateCSRF(request: NextRequest): { valid: boolean; error?: string } {
  const method = request.method.toUpperCase();
  
  // Only check state-changing methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true };
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Check Origin header first (preferred)
  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.some(allowed => 
      origin.toLowerCase() === allowed.toLowerCase()
    );

    if (!isAllowed) {
      console.warn(`[CSRF] Blocked request from origin: ${origin}`);
      return { 
        valid: false, 
        error: 'Invalid origin' 
      };
    }

    return { valid: true };
  }

  // Fallback to Referer header
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      
      const isAllowed = ALLOWED_ORIGINS.some(allowed => 
        refererOrigin.toLowerCase() === allowed.toLowerCase()
      );

      if (!isAllowed) {
        console.warn(`[CSRF] Blocked request from referer: ${referer}`);
        return { 
          valid: false, 
          error: 'Invalid referer' 
        };
      }

      return { valid: true };
    } catch (error) {
      console.warn('[CSRF] Invalid referer URL:', referer);
      return { 
        valid: false, 
        error: 'Invalid referer format' 
      };
    }
  }

  // If neither Origin nor Referer is present, block the request
  // (except for same-origin requests which might not send these headers)
  const host = request.headers.get('host');
  if (host) {
    // Allow if it's a same-origin request without Origin/Referer
    // This can happen with some browser configurations
    console.warn('[CSRF] No Origin or Referer header, allowing for same-origin');
    return { valid: true };
  }

  console.warn('[CSRF] No Origin, Referer, or Host header');
  return { 
    valid: false, 
    error: 'Missing security headers' 
  };
}

// Middleware helper for API routes
export function withCSRFProtection(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const csrfCheck = validateCSRF(request);
    
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { error: 'CSRF validation failed', details: csrfCheck.error },
        { status: 403 }
      );
    }

    return handler(request);
  };
}

// Generate CSRF token (for form-based protection if needed)
export function generateCSRFToken(): string {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Verify CSRF token (for form submissions)
export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false;
  return token === sessionToken;
}
