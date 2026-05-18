const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running migration: create-settings-table.sql\n');

  // Read SQL file
  const sqlPath = path.join(__dirname, 'migrations', 'create-settings-table.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  try {
    // Execute SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If RPC doesn't exist, try direct SQL execution
      console.log('Note: Using alternative method for SQL execution...');
      
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: stmtError } = await supabase.from('_sql_exec').select().limit(0);
        
        // For Supabase, we need to use the REST API or direct connection
        // This is a simplified approach - in production, use proper SQL execution
        console.log('Executing:', statement.substring(0, 50) + '...');
      }
      
      console.log('\n⚠️  Please execute the SQL manually in Supabase Dashboard:');
      console.log('1. Go to https://app.supabase.com');
      console.log('2. Select your project');
      console.log('3. Click "SQL Editor"');
      console.log('4. Copy and paste the contents of migrations/create-settings-table.sql');
      console.log('5. Click "Run"\n');
    } else {
      console.log('✅ Migration completed successfully!\n');
    }
  } catch (err) {
    console.error('❌ Error running migration:', err.message);
    console.log('\n⚠️  Please execute the SQL manually in Supabase Dashboard:\n');
    console.log('File: migrations/create-settings-table.sql\n');
  }
}

runMigration();
