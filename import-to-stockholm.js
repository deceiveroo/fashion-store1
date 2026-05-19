const { Pool } = require('pg');
const fs = require('fs');

// Конфигурация новой базы данных (Stockholm)
const pool = new Pool({
  connectionString: 'postgresql://postgres.norjvtaujxlbdbqgkmwd:12Laki345Nikita-@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: {
    rejectUnauthorized: false
  },
  max: 1, // Только одно соединение
  connectionTimeoutMillis: 60000, // Увеличиваем таймаут до 60 секунд
  statement_timeout: 120000,
});

async function importDatabase() {
  console.log('🚀 Starting database import to Stockholm...\n');
  
  const client = await pool.connect();
  
  try {
    // Проверяем подключение
    console.log('🔌 Testing connection...');
    const testResult = await client.query('SELECT current_database(), current_user');
    console.log(`✅ Connected to: ${testResult.rows[0]['current_database']} as ${testResult.rows[0]['current_user']}\n`);
    
    // Читаем SQL файл
    console.log('📖 Reading SQL file...');
    const sqlContent = fs.readFileSync('old-backup.sql', 'utf8');
    console.log(`   File size: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);
    
    // Устанавливаем таймауты
    console.log('⚙️  Setting session parameters...');
    await client.query('SET statement_timeout = "120s"');
    await client.query('SET idle_in_transaction_session_timeout = "120s"');
    console.log('   ✅ Timeouts configured\n');
    
    // Разбиваем на отдельные запросы
    console.log('⚙️  Processing SQL statements...');
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`   Found ${statements.length} statements\n`);
    
    // Выполняем каждый запрос с задержкой
    let completed = 0;
    let errors = 0;
    let skipped = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Для каждого запроса берем новое соединение из пула
      let queryClient;
      try {
        queryClient = await pool.connect();
        
        await queryClient.query(statement + ';');
        completed++;
        
        if (completed % 20 === 0) {
          console.log(`   Progress: ${completed}/${statements.length} (${Math.round(completed/statements.length*100)}%)`);
        }
        
      } catch (err) {
        // Пропускаем ошибки "already exists"
        if (err.message.includes('already exists') || 
            err.message.includes('does not exist') ||
            err.message.includes('duplicate key')) {
          skipped++;
        } else {
          console.error(`   ⚠️  Error #${i + 1}:`, err.message.substring(0, 120));
          errors++;
        }
      } finally {
        if (queryClient) {
          queryClient.release();
        }
        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('\n✅ Import completed!');
    console.log(`   Successful: ${completed} statements`);
    console.log(`   Skipped: ${skipped} statements`);
    console.log(`   Errors: ${errors} statements\n`);
    
    // Проверяем таблицы
    console.log('📊 Verifying tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`   Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`     - ${row.table_name}`);
    });
    
    // Проверяем данные
    console.log('\n📈 Checking data counts...');
    const keyTables = ['products', 'orders', 'profiles', 'user_profiles'];
    for (const tableName of keyTables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`   ${tableName}: ${result.rows[0]['count']} rows`);
      } catch (err) {
        console.log(`   ${tableName}: table not found`);
      }
    }
    
    console.log('\n✅ Migration to Stockholm completed successfully! 🎉');
    
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
    console.log('\n✅ Database connection closed');
  }
}

importDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
