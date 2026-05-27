import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server-auth';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { getJwtSecret } from '@/lib/jwt-secret';

const secret = getJwtSecret();

export async function GET(request: Request) {
  try {
    // Try NextAuth session first (cookie-based)
    let userId: string | null = null;
    
    const session = await auth();
    if (session?.user?.id) {
      userId = session.user.id;
    }
    
    // Try Bearer token as fallback
    if (!userId) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const { payload } = await jwtVerify(token, secret);
          userId = payload.userId as string || payload.sub as string;
        } catch (e) {
          console.error('[user/me] Invalid Bearer token:', e);
        }
      }
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user data from database
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        phone: '',
        image: user.image,
        role: user.role,
        orders: [], // Orders will be loaded separately if needed
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('[user/me] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
