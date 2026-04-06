import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { postgres } from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './lib/schema';

// Create a direct postgres connection for migration
const migrationConnection = postgres(process.env.DATABASE_URL!, { max: 1 });

async function runMigration() {
  console.log('Starting migration...');
  
  try {
    // Create a temporary db instance for migration
    const db = drizzle(migrationConnection, { schema });
    
    // Run the migration
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the migration connection
    await migrationConnection.end();
  }
}

runMigration();