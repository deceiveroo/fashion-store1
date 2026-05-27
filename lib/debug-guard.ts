import { NextResponse } from 'next/server';
import { isAdmin } from './server-auth';

// Returns null if access allowed, or a 403/404 NextResponse if not.
// Debug routes are blocked in production unless ALLOW_DEBUG_ROUTES=true AND caller is admin.
export async function debugRouteGuard(): Promise<NextResponse | null> {
  const isProd = process.env.NODE_ENV === 'production';
  const allow = process.env.ALLOW_DEBUG_ROUTES === 'true';

  if (isProd && !allow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (isProd && allow) {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  return null;
}
