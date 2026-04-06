import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../lib/db/schema';

// Disable prefetch as it's not supported in Edge runtime
const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', prepare: false });
export const db = drizzle(client, { schema, logger: true });