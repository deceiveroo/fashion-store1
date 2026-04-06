import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, products, categories } from '@/lib/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  const results: Record<string, any> = {};

  try {
    // 1. Basic connection test
    const ping = await db.execute(sql`SELECT 1 as ok`);
    results.connection = 'OK';
  } catch (e: any) {
    return NextResponse.json({ connection: 'FAILED', error: e.message }, { status: 500 });
  }

  try {
    const [row] = await db.select({ count: sql<number>`count(*)` }).from(users);
    results.users_count = Number(row.count);
  } catch (e: any) {
    results.users_error = e.message;
  }

  try {
    const [row] = await db.select({ count: sql<number>`count(*)` }).from(products);
    results.products_count = Number(row.count);
  } catch (e: any) {
    results.products_error = e.message;
  }

  try {
    const [row] = await db.select({ count: sql<number>`count(*)` }).from(categories);
    results.categories_count = Number(row.count);
  } catch (e: any) {
    results.categories_error = e.message;
  }

  try {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
    results.db_url_set = dbUrl.length > 0;
    results.db_url_preview = dbUrl ? dbUrl.replace(/:([^@]+)@/, ':***@') : 'NOT SET';
  } catch (e) {}

  return NextResponse.json(results);
}
