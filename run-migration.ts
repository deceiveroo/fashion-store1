import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';
import { db } from './lib/db';

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Run migrations
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

runMigration();