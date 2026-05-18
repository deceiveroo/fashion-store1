require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function addColumns() {
  try {
    console.log('Adding missing columns to products table...');
    
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE');
    console.log('✓ Added deleted_at');
    
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title TEXT');
    console.log('✓ Added seo_title');
    
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_desc TEXT');
    console.log('✓ Added seo_desc');
    
    console.log('\nAll columns added successfully!');
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addColumns();
