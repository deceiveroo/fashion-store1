const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Testing connection to:', connectionString?.split('@')[1]?.split('?')[0]);

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('✓ Connected successfully!');

    const result = await client.query('SELECT NOW()');
    console.log('✓ Query executed:', result.rows[0]);

    // Check existing tables
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('\nExisting tables:', tables.rows.length);
    tables.rows.forEach(row => console.log('  -', row.table_name));

    client.release();
    await pool.end();
    console.log('\n✓ Connection test completed successfully!');
  } catch (err) {
    console.error('✗ Connection failed:', err.message);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
