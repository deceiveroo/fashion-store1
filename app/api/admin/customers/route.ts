import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userProfiles } from '@/lib/schema';
import { eq, or, ilike, desc } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/admin/customers - Search and list customers/users
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin/manager role
    const userRole = (session.user as any).role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query with proper order: select -> from -> join -> where -> orderBy -> limit
    let results: any[];
    
    if (search.trim()) {
      // With search filter
      const searchTerm = `%${search.trim()}%`;
      results = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          firstName: userProfiles.firstName,
          lastName: userProfiles.lastName,
          avatar: userProfiles.avatar,
          image: users.image,
        })
        .from(users)
        .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
        .where(
          or(
            ilike(users.email, searchTerm),
            ilike(userProfiles.firstName, searchTerm),
            ilike(userProfiles.lastName, searchTerm)
          )
        )
        .orderBy(desc(users.createdAt))
        .limit(limit);
    } else {
      // Without search filter
      results = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          firstName: userProfiles.firstName,
          lastName: userProfiles.lastName,
          avatar: userProfiles.avatar,
          image: users.image,
        })
        .from(users)
        .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
        .orderBy(desc(users.createdAt))
        .limit(limit);
    }

    // Format response
    const customers = results.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar || user.image,
      role: user.role,
      createdAt: user.createdAt,
    }));

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
