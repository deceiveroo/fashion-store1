import { NextResponse } from 'next/server';

/**
 * Adds no-cache headers to prevent Vercel/browser caching of sensitive user data
 */
export function addNoCacheHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

/**
 * Creates a JSON response with no-cache headers
 */
export function jsonWithNoCache(data: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(data, init);
  return addNoCacheHeaders(response);
}
