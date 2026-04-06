import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { parseIntoClientConfig } from 'pg-connection-string';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './lib/schema';
import { drizzle } from 'drizzle-orm/node-postgres';

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
    allowExitOnIdle: false, // Important: set to false for migrations
    statement_timeout: 30000, query_timeout: 30000, keepAlive: false,
  };
}

async function runMigration() {
  const pool = new Pool(buildPoolConfig());
  
  try {
    console.log('Connected to database');
    
    // Create a db instance for migration
    const db = drizzle(pool, { schema, logger: false });
    
    // Run the migration
    console.log('Running migration...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the pool
    await pool.end();
    console.log('Disconnected from database');
  }
}

runMigration();