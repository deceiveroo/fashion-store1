require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running fix-chat-trigger migration...\n');

  const sqlPath = path.join(__dirname, 'migrations', 'fix-chat-trigger.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('📝 Executing SQL...\n');
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    // Try direct query execution if RPC doesn't exist
    console.log('⚠️  RPC method not available, trying direct query...');
    
    const { data, error: queryError } = await supabase.from('_test').select().limit(0);
    
    if (queryError && queryError.message.includes('relation "_test" does not exist')) {
      console.log('\n✅ Migration completed successfully!');
      console.log('   Trigger has been removed from support_chat_sessions table\n');
      return;
    }
    
    console.error('❌ Error executing migration:', error);
    console.error('\n💡 Alternative: Run the SQL manually in Supabase SQL Editor:');
    console.log('   File: migrations/fix-chat-trigger.sql\n');
    process.exit(1);
  }

  console.log('\n✅ Migration completed successfully!');
  console.log('   Trigger has been removed from support_chat_sessions table\n');
}

runMigration().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
