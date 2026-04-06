import { drizzle } from 'drizzle-orm/node-postgres';
import { parseIntoClientConfig } from 'pg-connection-string';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema';

function buildPoolConfig(): PoolConfig {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) throw new Error('DATABASE_URL is not set');
  const isSupabase = raw.includes('supabase.com') || raw.includes('pooler.supabase.com');
  const base = parseIntoClientConfig(raw);
  const password = (base.password ? String(base.password) : '') || (process.env.DATABASE_PASSWORD ? String(process.env.DATABASE_PASSWORD) : '');
  return {
    ...base, password,
    ssl: process.env.NODE_ENV === 'production' ? true : isSupabase ? { rejectUnauthorized: false } : base.ssl ?? false,
    max: 1, min: 0, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000,
    allowExitOnIdle: true, statement_timeout: 30000, query_timeout: 30000, keepAlive: false,
  };
}

export const pool = new Pool(buildPoolConfig());
let connectionCount = 0;
pool.on('error', (err) => console.error('Unexpected error on idle client', err));
pool.on('connect', () => { connectionCount++; if (process.env.NODE_ENV === 'development') console.log(`DB connection established (total: ${connectionCount})`); });
pool.on('remove', () => { connectionCount--; if (process.env.NODE_ENV === 'development') console.log(`DB connection removed (remaining: ${connectionCount})`); });

export const db = drizzle(pool, { schema, logger: false });

export async function safeQuery<T>(queryFn: () => Promise<T>, retries = 3): Promise<T | null> {
  for (let i = 0; i < retries + 1; i++) {
    try {
      return await queryFn();
    } catch (error: any) {
      const isConnectionError =
        error.message?.includes('Connection terminated') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('terminated unexpectedly') ||
        error.message?.includes('timeout exceeded') ||
        error.message?.includes('Query read timeout') ||
        error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'XX000';
      if (isConnectionError && i < retries) {
        console.warn(`Query failed (attempt ${i + 1}/${retries + 1}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      console.error('Query failed after retries:', error.message);
      throw error;
    }
  }
  return null;
}