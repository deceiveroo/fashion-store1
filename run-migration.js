const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running migration: add-notification-dismissals.sql\n');

  const sqlContent = fs.readFileSync(
    path.join(__dirname, 'migrations', 'add-notification-dismissals.sql'),
    'utf8'
  );

  try {
    // Execute SQL directly using Supabase REST API
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Migration failed:', error.message);
      
      // Try alternative method - execute each statement separately
      console.log('\n⚠️  Trying alternative method...\n');
      
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (stmtError) {
            console.error(`  ❌ Failed: ${stmtError.message}`);
          } else {
            console.log(`  ✅ Success`);
          }
        } catch (err) {
          console.error(`  ❌ Error: ${err.message}`);
        }
      }
    } else {
      console.log('✅ Migration completed successfully!');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

runMigration();
