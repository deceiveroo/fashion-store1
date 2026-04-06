require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

// Bypass self-signed cert issue globally for the test
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("❌ DATABASE_URL is not set in .env");
  process.exit(1);
}

// Mask password for console output
console.log("Attempting to connect to:", url.replace(/:[^:@]+@/, ':***@'));

const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  console.log("⏳ Initiating connection pool...");
  try {
    const client = await pool.connect();
    console.log("✅ Successfully connected to Supabase PostgreSQL!");
    
    console.log("⏳ Running test query: SELECT 1");
    const result = await client.query('SELECT 1 as connected;');
    console.log("✅ Query successful. Output:", result.rows[0]);
    
    client.release();
    console.log("✅ Test complete. Exiting.");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Connection failed!");
    console.error("Message:", error.message);
    if (error.code) console.error("Code:", error.code);
    process.exit(1);
  }
}

testConnection();
