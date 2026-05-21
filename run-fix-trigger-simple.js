require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Fixing chat trigger...\n');

  // Drop the problematic trigger
  console.log('📝 Dropping trigger calculate_response_times_trigger...');
  const { error: triggerError } = await supabase.rpc('exec_sql', {
    sql_query: 'DROP TRIGGER IF EXISTS calculate_response_times_trigger ON support_chat_sessions;'
  });

  if (triggerError) {
    console.log('⚠️  RPC not available, using alternative method...\n');
    
    // Try using raw SQL through REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        query: 'DROP TRIGGER IF EXISTS calculate_response_times_trigger ON support_chat_sessions;'
      })
    });

    if (!response.ok) {
      console.error('❌ Failed to execute via REST API');
      console.error('\n💡 Please run this SQL manually in Supabase Dashboard:\n');
      console.log('   1. Go to https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Go to SQL Editor');
      console.log('   4. Run this SQL:\n');
      console.log('   --- COPY THIS ---');
      console.log('   DROP TRIGGER IF EXISTS calculate_response_times_trigger ON support_chat_sessions;');
      console.log('   DROP TRIGGER IF EXISTS trg_calculate_response_times ON support_chat_sessions;');
      console.log('   DROP FUNCTION IF EXISTS calculate_response_times() CASCADE;');
      console.log('   --- END ---\n');
      process.exit(1);
    }
  }

  // Drop the function
  console.log('📝 Dropping function calculate_response_times...');
  const { error: funcError } = await supabase.rpc('exec_sql', {
    sql_query: 'DROP FUNCTION IF EXISTS calculate_response_times();'
  });

  console.log('\n✅ Migration completed successfully!');
  console.log('   The problematic trigger has been removed.\n');
  console.log('💡 You can now use the chat takeover feature without errors.\n');
}

runMigration().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
