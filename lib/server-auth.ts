import { auth } from './auth'; // NextAuth v5
import { db, safeQuery } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import {
  canManageOrders,
  canManageProducts,
  canManageSettings,
  canManageUsers,
  canViewCustomers,
  isStaffRole,
} from './admin-permissions';
import { cache } from 'react';

// NextAuth v5: используем auth() вместо getServerSession()
// Cache session for the duration of the request to avoid multiple DB queries
export const getSession = cache(async () => {
  try {
    const session = await auth(); // v5: просто auth()
    if (!session?.user?.id) return null;

    const row = await safeQuery(async () => {
      const [result] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          image: users.image,
          status: users.status,
        })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);
      return result;
    });

    if (!row || row.status === 'banned' || row.status === 'suspended') return null;

    return {
      ...session,
      user: {
        ...session.user,
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role ?? 'user',
        image: row.image,
      },
    };
  } catch (e) {
    console.error('getSession:', e);
    return null;
  }
});

// New function to require authentication
export async function requireUser(): Promise<{ id: string; email: string; name: string; role: string; image?: string }> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('User not authenticated');
  }
  return session.user;
}

export async function isStaff() {
  const s = await getSession();
  if (!s?.user || !isStaffRole(s.user.role)) {
    return null;
  }
  return s.user;
}

export async function isAdmin() {
  const s = await getSession();
  if (!s?.user || s.user.role !== 'admin') {
    return null;
  }
  return s.user;
}

export async function checkStaff(): Promise<boolean> {
  return isStaff();
}

export async function checkCanManageProducts(): Promise<boolean> {
  const s = await getSession();
  return canManageProducts(s?.user?.role);
}

export async function checkCanManageOrders(): Promise<boolean> {
  const s = await getSession();
  return canManageOrders(s?.user?.role);
}

export {
  canManageOrders,
  canManageProducts,
  canManageSettings,
  canManageUsers,
  canViewCustomers,
  isStaffRole,
};