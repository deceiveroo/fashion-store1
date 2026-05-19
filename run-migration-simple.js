require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Running migration...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    
    const sqlContent = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add-notification-dismissals.sql'),
      'utf8'
    );

    console.log('Executing SQL...');
    await client.query(sqlContent);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify table exists
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_notification_dismissals'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nTable columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) {
      console.error('Detail:', error.detail);
    }
    await pool.end();
    process.exit(1);
  }
}

runMigration();
