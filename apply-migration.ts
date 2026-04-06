import { Client } from 'pg';
import { promises as fs } from 'fs';

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Read the migration file
    const migrationFiles = await fs.readdir('./drizzle');
    const migrationFile = migrationFiles.find(f => f.endsWith('.sql'));
    
    if (!migrationFile) {
      console.error('No migration file found');
      return;
    }
    
    console.log(`Found migration file: ${migrationFile}`);
    
    const sql = await fs.readFile(`./drizzle/${migrationFile}`, 'utf8');
    console.log('Executing migration SQL...');
    
    // Execute the migration
    await client.query(sql);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

runMigration();