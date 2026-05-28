import { drizzle } from 'drizzle-orm/node-postgres';
import { parseIntoClientConfig } from 'pg-connection-string';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema';

// Singleton pattern to prevent multiple pool instances in development
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
  poolListenersAttached: boolean | undefined;
};

function buildPoolConfig(): PoolConfig {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) throw new Error('DATABASE_URL is not set');
  const isSupabase = raw.includes('supabase.com') || raw.includes('pooler.supabase.com');
  const base = parseIntoClientConfig(raw);
  const password = (base.password ? String(base.password) : '') || (process.env.DATABASE_PASSWORD ? String(process.env.DATABASE_PASSWORD) : '');
  const isProd = process.env.NODE_ENV === 'production';
  return {
    ...base, password,
    ssl: isSupabase ? { rejectUnauthorized: false } : isProd ? true : base.ssl ?? false,
    // В Vercel serverless лимиты pooler-а критичны (max=3), но в локальной
    // dev-сессии страница может стрелять 6–8 параллельных API-запросов —
    // даём больший пул, чтобы не было очереди и таймаутов.
    max: isSupabase ? (isProd ? 3 : 10) : 8,
    min: 0,
    // Дольше держим idle соединения в dev: иначе при каждом обновлении страницы
    // pg создаёт коннекты с нуля (это и было причиной «медленно грузится»).
    idleTimeoutMillis: isProd ? 10_000 : 60_000,
    connectionTimeoutMillis: 15_000,
    allowExitOnIdle: false,
    statement_timeout: 30_000,
    query_timeout: 30_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 5_000,
  };
}

// Thread-safe connection counter
let activeConnections = 0;
const connectionLock = { locked: false };

let poolInstance: Pool | undefined;

function getPoolInstance(): Pool {
  if (poolInstance) return poolInstance;

  if (globalForDb.pool) {
    poolInstance = globalForDb.pool;
  } else {
    const poolConfig = buildPoolConfig();
    poolInstance = new Pool(poolConfig);
    globalForDb.pool = poolInstance;
  }

  if (!globalForDb.poolListenersAttached) {
    globalForDb.poolListenersAttached = true;
    poolInstance.on('error', (err) => console.error('Unexpected error on idle client', err));
    poolInstance.on('connect', () => { 
      activeConnections++; 
      if (process.env.NODE_ENV === 'development' && activeConnections > 5) {
        console.log(`✓ DB connection established (active: ${activeConnections})`); 
      }
    });
    poolInstance.on('remove', () => { 
      if (activeConnections > 0) {
        activeConnections--; 
      }
      if (process.env.NODE_ENV === 'development' && activeConnections > 3) {
        console.log(`✗ DB connection removed (active: ${activeConnections})`); 
      }
    });
  }

  return poolInstance;
}

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const instance = getPoolInstance() as any;
    const value = Reflect.get(instance, prop, instance);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | undefined;
function getDbInstance(): ReturnType<typeof drizzle<typeof schema>> {
  if (!dbInstance) {
    dbInstance = drizzle(getPoolInstance(), { schema, logger: false });
  }
  return dbInstance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const instance = getDbInstance() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(instance, prop, instance);
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
  },
});

// Add pool health check
export async function checkPoolHealth(): Promise<boolean> {
  try {
    await getPoolInstance().query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database pool health check failed:', error);
    return false;
  }
}

// Periodic health check in development
if (process.env.NODE_ENV === 'development') {
  setInterval(async () => {
    const healthy = await checkPoolHealth();
    if (!healthy) {
      console.warn('⚠️  Database connection unhealthy - attempting recovery...');
      // Pool will automatically reconnect on next query
    }
  }, 60000); // Check every minute
}

export async function safeQuery<T>(queryFn: () => Promise<T>, retries = 3): Promise<T | null> {
  // В dev уменьшаем число retry: задержка 1+2+4=7 сек на каждый запрос делает
  // загрузку страницы непригодной если БД отвалилась хоть раз.
  const isProd = process.env.NODE_ENV === 'production';
  const effectiveRetries = isProd ? retries : Math.min(retries, 1);

  for (let i = 0; i < effectiveRetries + 1; i++) {
    try {
      return await queryFn();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = error instanceof Error && 'code' in error ? (error as { code?: string }).code : undefined;

      const isConnectionError =
        errorMessage.includes('Connection terminated') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('terminated unexpectedly') ||
        errorMessage.includes('timeout exceeded') ||
        errorMessage.includes('Query read timeout') ||
        errorCode === 'ECONNRESET' || errorCode === 'ETIMEDOUT' || errorCode === 'XX000';

      if (isConnectionError && i < effectiveRetries) {
        // Бэкофф мягче в dev: 200ms, 400ms (вместо 1с/2с/4с).
        const delay = isProd ? 1000 * Math.pow(2, i) : 200 * Math.pow(2, i);
        console.warn(`Query failed (attempt ${i + 1}/${effectiveRetries + 1}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      console.error('Query failed after retries:', errorMessage);
      throw error;
    }
  }
  return null;
}
