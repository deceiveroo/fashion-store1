const fs = require('fs');
const { Client } = require('pg');

// Конфигурация новой базы данных (Stockholm)
const NEW_DB_CONFIG = {
  connectionString: 'postgresql://postgres.norjvtaujxlbdbqgkmwd:12Laki345Nikita-@aws-1-eu-north-1.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
};

async function importSQLFile(filePath) {
  console.log('🚀 Starting database import...\n');
  console.log(`Target: ${NEW_DB_CONFIG.host}`);
  console.log(`File: ${filePath}\n`);

  const client = new Client(NEW_DB_CONFIG);
  
  // Добавляем обработчик ошибок чтобы предотвратить краш
  client.on('error', (err) => {
    console.error('   ⚠️  Client error:', err.message);
    // Не выбрасываем ошибку, позволяем продолжить выполнение
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Читаем SQL файл
    console.log('📖 Reading SQL file...');
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    console.log(`   File size: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);

    // Разбиваем на отдельные запросы по точкам с запятой
    console.log('⚙️  Processing SQL statements...');
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`   Found ${statements.length} statements\n`);

    // Выполняем каждый запрос
    let completed = 0;
    let errors = 0;
    let reconnectAttempts = 0;
    const maxReconnects = 5;

    for (const statement of statements) {
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await client.query(statement);
          completed++;
          
          if (completed % 10 === 0) {
            console.log(`   Progress: ${completed}/${statements.length} statements`);
          }
          break; // Успех, выходим из цикла retry
        } catch (err) {
          // Если соединение разорвалось, переподключаемся
          if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
            retryCount++;
            reconnectAttempts++;
            
            if (reconnectAttempts > maxReconnects) {
              throw new Error('Max reconnection attempts reached');
            }
            
            console.log(`   ⚠️  Connection lost, reconnecting (${reconnectAttempts}/${maxReconnects})...`);
            await client.end().catch(() => {});
            await new Promise(resolve => setTimeout(resolve, 2000)); // Ждем 2 секунды
            await client.connect();
            console.log(`   ✅ Reconnected`);
            continue;
          }
          
          // Игнорируем ошибки "already exists" и подобные
          if (!err.message.includes('already exists') && 
              !err.message.includes('does not exist')) {
            console.error(`   ⚠️  Error in statement ${completed + 1}:`, err.message.substring(0, 100));
            errors++;
          }
          break; // Другая ошибка, переходим к следующему запросу
        }
      }
    }

    console.log('\n✅ Import completed!');
    console.log(`   Successful: ${completed} statements`);
    console.log(`   Errors: ${errors} statements\n`);

    // Проверяем таблицы
    console.log('📊 Verifying tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log(`   Found ${tables.rows.length} tables:`);
    tables.rows.forEach(row => {
      console.log(`     - ${row.table_name}`);
    });

    // Проверяем количество записей в ключевых таблицах
    console.log('\n📈 Checking data counts...');
    
    const keyTables = ['products', 'orders', 'users', 'profiles'];
    for (const tableName of keyTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`   ${tableName}: ${result.rows[0].count} rows`);
      } catch (err) {
        console.log(`   ${tableName}: table not found or error`);
      }
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

// Запуск
const sqlFile = process.argv[2] || 'old-backup.sql';
importSQLFile(sqlFile).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
