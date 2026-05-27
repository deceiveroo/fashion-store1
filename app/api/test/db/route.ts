import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { NextRequest } from 'next/server';
import { debugRouteGuard } from '@/lib/debug-guard';

export async function GET(request: NextRequest) {
  const blocked = await debugRouteGuard();
  if (blocked) return blocked;
  try {
    // Test the database connection by attempting a simple query
    const userCount = await db.select({ count: users.id }).from(users).limit(1);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database connection successful!',
        userCount: userCount.length,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Database connection error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}