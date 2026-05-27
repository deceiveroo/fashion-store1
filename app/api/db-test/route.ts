import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { debugRouteGuard } from '@/lib/debug-guard';

export async function GET() {
  const blocked = await debugRouteGuard();
  if (blocked) return blocked;
  try {
    // Test basic connection by getting database info
    const result = await db.execute(sql`SELECT current_database(), inet_server_addr()`);

    // Try to count users
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);

    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      databaseInfo: result,
      userCount: userCount[0]?.count || 0,
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}