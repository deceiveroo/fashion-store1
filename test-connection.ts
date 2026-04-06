import { Pool } from 'pg';

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('✓ Connected to database successfully!');
    const result = await client.query('SELECT NOW()');
    console.log('✓ Query executed:', result.rows[0]);
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('✗ Connection failed:', error.message);
    console.error('Hostname:', error.hostname || 'N/A');
    console.error('Code:', error.code || 'N/A');
    process.exit(1);
  }
})();
