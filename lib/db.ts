import { drizzle } from 'drizzle-orm/node-postgres';
import { parseIntoClientConfig } from 'pg-connection-string';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema';

function buildPoolConfig(): PoolConfig {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error('DATABASE_URL is not set');
  }

  const isSupabase =
    raw.includes('supabase.com') || raw.includes('pooler.supabase.com');

  const base = parseIntoClientConfig(raw);

  const fromUrl =
    base.password !== undefined && base.password !== null && String(base.password) !== ''
      ? String(base.password)
      : '';
  const fromEnv =
    process.env.DATABASE_PASSWORD !== undefined &&
    process.env.DATABASE_PASSWORD !== null &&
    String(process.env.DATABASE_PASSWORD) !== ''
      ? String(process.env.DATABASE_PASSWORD)
      : '';
  /** SCRAM в pg требует typeof password === 'string'; при разборе URL пароль иногда теряется. */
  const password = fromUrl || fromEnv;

  return {
    ...base,
    password,
    ssl:
      process.env.NODE_ENV === 'production'
        ? true
        : isSupabase
          ? { rejectUnauthorized: false }
          : base.ssl ?? false,
    max: isSupabase ? 3 : 5, // Увеличено для Supabase
    min: 0,
    idleTimeoutMillis: 30000, // Увеличено до 30 секунд
    connectionTimeoutMillis: 30000, // Увеличено до 30 секунд
    allowExitOnIdle: true, // Разрешаем выход при idle
    statement_timeout: 30000, // Увеличено до 30 секунд
    query_timeout: 30000, // Увеличено до 30 секунд
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000, // Увеличено до 10 секунд
  };
}

export const pool = new Pool(buildPoolConfig());

let connectionCount = 0;

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  connectionCount++;
  if (process.env.NODE_ENV === 'development') {
    console.log(`DB connection established (total: ${connectionCount})`);
  }
});

pool.on('remove', () => {
  connectionCount--;
  if (process.env.NODE_ENV === 'development') {
    console.log(`DB connection removed (remaining: ${connectionCount})`);
  }
});

export const db = drizzle(pool, { 
  schema, 
  logger: false // Disable query logging to reduce overhead
});

// Helper function for safe queries with automatic retry
export async function safeQuery<T>(queryFn: () => Promise<T>, retries = 2): Promise<T | null> {
  for (let i = 0; i < retries + 1; i++) {
    try {
      return await queryFn();
    } catch (error: any) {
      const isConnectionError = 
        error.message?.includes('Connection terminated') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('terminated unexpectedly') ||
        error.message?.includes('Max client connections reached') ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'XX000';
      
      if (isConnectionError && i < retries) {
        console.warn(`Query failed (attempt ${i + 1}/${retries + 1}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        continue;
      }
      
      console.error('Query failed after retries:', error.message);
      throw error; // Re-throw to let caller handle
    }
  }
  return null;
}
