import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, products, categories } from '@/lib/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    // 1. Basic connection test
    const ping = await db.execute(sql`SELECT 1 as ok`);
    results.connection = 'OK';
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ connection: 'FAILED', error: errorMessage }, { status: 500 });
  }

  try {
    const [row] = await db.select({ count: sql<number>`count(*)` }).from(users);
    results.users_count = Number(row.count);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    results.users_error = errorMessage;
  }

  try {
    const [row] = await db.select({ count: sql<number>`count(*)` }).from(products);
    results.products_count = Number(row.count);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    results.products_error = errorMessage;
  }

  try {
    const [row] = await db.select({ count: sql<number>`count(*)` }).from(categories);
    results.categories_count = Number(row.count);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    results.categories_error = errorMessage;
  }

  try {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
    results.db_url_set = dbUrl.length > 0;
    results.db_url_preview = dbUrl ? dbUrl.replace(/:([^@]+)@/, ':***@') : 'NOT SET';
  } catch (e) {}

  return NextResponse.json(results);
}
