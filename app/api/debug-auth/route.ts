import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { sql } from 'drizzle-orm';
import { compare } from 'bcryptjs';

export async function GET() {
  try {
    const email = 'admin@fashionstore.com';
    const password = 'FashionStore2026!';

    const [user] = await db
      .select({ id: users.id, email: users.email, role: users.role, password: users.password, status: users.status })
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);

    if (!user) return NextResponse.json({ error: 'user not found' });

    const ok = user.password ? await compare(password, user.password) : false;

    return NextResponse.json({
      found: true,
      email: user.email,
      role: user.role,
      status: user.status,
      hasPassword: !!user.password,
      passwordMatch: ok,
      hashPrefix: user.password?.substring(0, 7),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
