import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// Load .env then .env.local so local overrides; drizzle needs direct Postgres for push (not pgbouncer)
config({ path: '.env' });
config({ path: '.env.local', override: true });

export default defineConfig({
  schema: './lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!
  },
  verbose: true,
});