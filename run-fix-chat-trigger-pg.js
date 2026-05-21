require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
  console.error('❌ Missing DIRECT_URL in .env.local');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({ connectionString });
  
  try {
    console.log('🚀 Connecting to database...\n');
    await client.connect();
    console.log('✅ Connected to database\n');

    const sqlPath = path.join(__dirname, 'migrations', 'fix-chat-trigger.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📝 Executing SQL migration...\n');
    
    // Split SQL by statements and execute each
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.includes('/*')) continue; // Skip comments
      
      console.log(`Executing: ${statement.substring(0, 80)}...`);
      await client.query(statement);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('   Trigger has been removed from support_chat_sessions table\n');
    console.log('💡 You can now use the chat takeover feature without errors.\n');
    
  } catch (error) {
    console.error('❌ Error executing migration:', error.message);
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed\n');
  }
}

runMigration().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
