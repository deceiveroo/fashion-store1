import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userProfiles } from '@/lib/schema';
import { eq, or } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !['admin', 'manager', 'support'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get all customers (role: user, customer, or any non-staff role)
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        phone: userProfiles.phone,
        role: users.role,
        image: users.image,
        status: users.status,
        createdAt: users.createdAt,
        emailVerified: users.emailVerified,
        avatar: userProfiles.avatar,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .orderBy(users.createdAt)
      .limit(limit)
      .offset(offset);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[CUSTOMERS]', error.message);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
