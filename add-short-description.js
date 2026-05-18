require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function addColumn() {
  try {
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT');
    console.log('✓ Column short_description added successfully');
    
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name LIKE '%description%'
    `);
    
    console.log('Description columns:', result.rows);
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addColumn();
