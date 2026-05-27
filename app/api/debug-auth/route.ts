import { NextResponse } from 'next/server';
import { debugRouteGuard } from '@/lib/debug-guard';

// Stripped-down: previously this route compared a HARDCODED password against the DB.
// That is a security disaster regardless of who can reach the route, so the password
// flow has been removed. Use the regular login endpoint to verify auth.
export async function GET() {
  const blocked = await debugRouteGuard();
  if (blocked) return blocked;
  return NextResponse.json({
    note: 'debug-auth password-check removed for security. Use POST /api/user/login instead.',
  });
}
