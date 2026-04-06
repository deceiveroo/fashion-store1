const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    max: 1
  });
}

async function executeWithRetry(queryFn, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await queryFn();
    } catch (err) {
      if ((err.code === 'ECONNRESET' || err.message.includes('Connection terminated')) && attempt < retries) {
        console.log(`    ⚠ Connection lost, retrying (${attempt}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw err;
    }
  }
}

async function applyMigrations() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Connecting to:', connectionString?.split('@')[1]?.split('?')[0]);

  try {
    // Create __drizzle_migrations table
    let pool = createPool();
    let client = await pool.connect();
    console.log('✓ Connected successfully!');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT
      );
    `);
    console.log('✓ Ensured __drizzle_migrations table exists');

    const appliedResult = await client.query('SELECT hash FROM "__drizzle_migrations"');
    const appliedHashes = new Set(appliedResult.rows.map(r => r.hash));
    console.log(`Found ${appliedHashes.size} already applied migrations`);

    client.release();
    await pool.end();

    // Read migration files
    const migrationsDir = path.join(__dirname, 'drizzle');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    // Only apply the latest migration
    const latestMigration = migrationFiles[migrationFiles.length - 1];
    const filePath = path.join(migrationsDir, latestMigration);
    const content = fs.readFileSync(filePath, 'utf-8');

    const hash = Buffer.from(content).toString('base64').substring(0, 50);

    if (appliedHashes.has(hash)) {
      console.log(`Migration ${latestMigration} already applied, skipping`);
    } else {
      console.log(`\nApplying ${latestMigration}...`);

      const statements = content.split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      console.log(`Executing ${statements.length} statements one by one...\n`);

      // Execute each statement with its own connection
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];

        await executeWithRetry(async () => {
          pool = createPool();
          client = await pool.connect();

          try {
            await client.query(statement);
            console.log(`  ✓ Statement ${i + 1}/${statements.length}`);
          } catch (err) {
            if (err.message.includes('already exists')) {
              console.log(`  ⊘ Statement ${i + 1}/${statements.length} (already exists)`);
            } else {
              console.error(`  ✗ Statement ${i + 1} failed:`, err.message.substring(0, 100));
              throw err;
            }
          } finally {
            client.release();
            await pool.end();
          }
        });

        // Small delay between statements
        if (i < statements.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Record migration as applied
      pool = createPool();
      client = await pool.connect();
      await client.query(
        'INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
        [hash, Date.now()]
      );
      console.log(`\n✓ Migration ${latestMigration} recorded`);
      client.release();
      await pool.end();
    }

    // Final verification
    pool = createPool();
    client = await pool.connect();
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log(`\n✓ Total tables in database: ${tables.rows.length}`);
    tables.rows.forEach(row => console.log('  -', row.table_name));

    client.release();
    await pool.end();
    console.log('\n✓ All migrations applied successfully!');
  } catch (err) {
    console.error('\n✗ Migration failed:', err.message);
    process.exit(1);
  }
}

applyMigrations();
