const { Pool } = require('pg');
require('dotenv').config();

async function createUsersTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    max: 1
  });

  try {
    console.log('Creating users table...');
    const client = await pool.connect();

    // Set statement timeout to 30 seconds
    await client.query('SET statement_timeout = 30000');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text,
        "email" text NOT NULL,
        "password" text,
        "email_verified" timestamp,
        "image" text,
        "role" text DEFAULT 'user',
        "two_factor_secret" text,
        "last_edited_at" timestamp,
        "affinity_scores" jsonb,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "users_email_unique" UNIQUE("email")
      )
    `);

    console.log('✓ Users table created');

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email")`);
    console.log('✓ Created email index');

    await client.query(`CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role")`);
    console.log('✓ Created role index');

    // Verify
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('\n✓ Users table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    client.release();
    await pool.end();
    console.log('\n✓ Users table setup complete!');
  } catch (err) {
    console.error('✗ Failed:', err.message);
    await pool.end();
    process.exit(1);
  }
}

createUsersTable();
