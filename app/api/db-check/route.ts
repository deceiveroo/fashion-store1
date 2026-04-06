import { db } from '../../../src/db';
import { users } from '../../../lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to insert a test user
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
    };

    const insertedUsers = await db.insert(users).values(testUser).returning();
    
    // Fetch all users
    const fetchedUsers = await db.select().from(users);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      data: {
        insertedUser: insertedUsers[0],
        totalUsers: fetchedUsers.length,
        users: fetchedUsers
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}