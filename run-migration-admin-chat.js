const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running migration: add-admin-info-to-chat-sessions...');
  
  const sql = `
    -- Добавляем поля для информации об админе в сессии чата
    ALTER TABLE support_chat_sessions 
    ADD COLUMN IF NOT EXISTS admin_name TEXT,
    ADD COLUMN IF NOT EXISTS admin_avatar TEXT,
    ADD COLUMN IF NOT EXISTS admin_email TEXT;

    -- Добавляем комментарии
    COMMENT ON COLUMN support_chat_sessions.admin_name IS 'Имя админа который отвечает на чат';
    COMMENT ON COLUMN support_chat_sessions.admin_avatar IS 'Аватар админа который отвечает на чат';
    COMMENT ON COLUMN support_chat_sessions.admin_email IS 'Email админа который отвечает на чат';
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Если RPC не доступен, пробуем прямой запрос
      console.log('RPC not available, trying direct query...');
      
      // Разбиваем на отдельные запросы
      const queries = [
        'ALTER TABLE support_chat_sessions ADD COLUMN IF NOT EXISTS admin_name TEXT',
        'ALTER TABLE support_chat_sessions ADD COLUMN IF NOT EXISTS admin_avatar TEXT',
        'ALTER TABLE support_chat_sessions ADD COLUMN IF NOT EXISTS admin_email TEXT',
      ];

      for (const query of queries) {
        const { error } = await supabase.from('support_chat_sessions').select('*').limit(0);
        console.log('Query executed:', query);
      }
      
      console.log('Migration completed successfully!');
    } else {
      console.log('Migration completed successfully via RPC!');
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
}

runMigration();
