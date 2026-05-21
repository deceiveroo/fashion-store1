import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server-auth';
import { db } from '@/lib/db';
import { users, userProfiles, orders } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// GET /api/admin/users/[id] - Get detailed user information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get user with profile
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        emailVerified: users.emailVerified,
        lastSignIn: users.lastSignIn,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        phone: userProfiles.phone,
        avatar: userProfiles.avatar,
        address: userProfiles.address,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(users.id, id));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get order statistics
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, id));

    const orderStats = {
      totalOrders: userOrders.length,
      totalSpent: userOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      averageOrderValue: userOrders.length > 0 
        ? userOrders.reduce((sum, order) => sum + Number(order.total || 0), 0) / userOrders.length 
        : 0,
      lastOrderDate: userOrders.length > 0 
        ? userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
        : null,
    };

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        displayName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : user.email?.split('@')[0] || 'Пользователь',
        orderStats,
      },
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
