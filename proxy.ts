import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth check is handled client-side in AdminLayout via useSession
// This proxy just passes all requests through
export async function proxy(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
