import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userProfiles } from '@/lib/schema';
import { eq, notInArray, count } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';

const STAFF_ROLES = ['admin', 'manager', 'support'] as const;

export async function GET(request: NextRequest) {
  try {
    const staff = await isStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    const [result, [{ total }]] = await Promise.all([
      db
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
        // Only return actual customers, not staff
        .where(notInArray(users.role, [...STAFF_ROLES]))
        .orderBy(users.createdAt)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(users)
        .where(notInArray(users.role, [...STAFF_ROLES])),
    ]);

    return NextResponse.json({ customers: result, total });
  } catch (error: any) {
    console.error('[CUSTOMERS]', error.message);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
