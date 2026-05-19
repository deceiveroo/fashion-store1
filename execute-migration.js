// Execute migration using fetch to Supabase REST API
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

async function executeMigration() {
  console.log('🚀 Executing migration...\n');

  const sqlContent = fs.readFileSync(
    path.join(__dirname, 'migrations', 'add-notification-dismissals.sql'),
    'utf8'
  );

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    // Use the postgres endpoint to execute raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql: sqlContent })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Migration failed:', error);
      
      // Try direct SQL execution via REST API
      console.log('\n⚠️  Trying alternative method with direct SQL...\n');
      
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const stmtResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ sql: statement })
          });
          
          if (!stmtResponse.ok) {
            const stmtError = await stmtResponse.text();
            console.error(`  ❌ Failed: ${stmtError}`);
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
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

executeMigration();
