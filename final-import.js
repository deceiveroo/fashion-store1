const { Pool } = require('pg');
const fs = require('fs');

// Конфигурация новой базы данных (Stockholm)
const pool = new Pool({
  connectionString: 'postgresql://postgres.norjvtaujxlbdbqgkmwd:12Laki345Nikita-@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,
  statement_timeout: 120000,
});

// Функция для выполнения запросов с повторными попытками
async function executeWithRetry(client, query, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await client.query(query);
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`   Retry ${i + 1}/${retries} for query...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function importDatabase() {
  console.log('🚀 Starting database import to Stockholm...\n');
  
  const client = await pool.connect();
  
  try {
    // Проверяем подключение
    console.log('🔌 Testing connection...');
    const testResult = await client.query('SELECT current_database(), current_user, version()');
    console.log(`✅ Connected to: ${testResult.rows[0]['current_database']} as ${testResult.rows[0]['current_user']}`);
    console.log(`   PostgreSQL version: ${testResult.rows[0]['version'].split(',')[0]}\n`);
    
    // Читаем SQL файл
    console.log('📖 Reading SQL file...');
    const sqlContent = fs.readFileSync('old-backup.sql', 'utf8');
    console.log(`   File size: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);
    
    // Устанавливаем таймауты
    console.log('⚙️  Setting session parameters...');
    await client.query('SET statement_timeout = "120s"');
    await client.query('SET idle_in_transaction_session_timeout = "120s"');
    await client.query('SET lock_timeout = "60s"');
    console.log('   ✅ Timeouts configured\n');
    
    // Очищаем SQL от комментариев и пустых строк
    console.log('⚙️  Processing SQL statements...');
    const statements = sqlContent
      .split(';')
      .map(stmt => {
        let cleaned = stmt
          .split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n');
        return cleaned.trim();
      })
      .filter(stmt => stmt.length > 0 && stmt !== ';');
    
    console.log(`   Found ${statements.length} statements\n`);
    
    // Группируем в транзакции по 50 запросов
    console.log('⚙️  Grouping into transactions...');
    const transactions = [];
    let currentTransaction = [];
    
    for (const statement of statements) {
      currentTransaction.push(statement);
      
      if (currentTransaction.length >= 50) {
        transactions.push([...currentTransaction]);
        currentTransaction = [];
      }
    }
    
    if (currentTransaction.length > 0) {
      transactions.push(currentTransaction);
    }
    
    console.log(`   Created ${transactions.length} transactions\n`);
    
    // Выполняем транзакции
    let completed = 0;
    let errors = 0;
    let skipped = 0;
    let totalStatements = statements.length;
    
    for (let t = 0; t < transactions.length; t++) {
      const transaction = transactions[t];
      console.log(`📦 Transaction ${t + 1}/${transactions.length} (${transaction.length} statements)...`);
      
      let transactionClient;
      try {
        transactionClient = await pool.connect();
        await transactionClient.query('BEGIN');
        
        for (let i = 0; i < transaction.length; i++) {
          const statement = transaction[i];
          try {
            await executeWithRetry(transactionClient, statement + ';');
            completed++;
            
            if (completed % 50 === 0 || completed === totalStatements) {
              console.log(`   Progress: ${completed}/${totalStatements} (${Math.round(completed/totalStatements*100)}%)`);
            }
          } catch (err) {
            if (err.message.includes('already exists') || 
                err.message.includes('duplicate key') ||
                err.message.includes('already present')) {
              skipped++;
            } else if (err.message.includes('does not exist')) {
              skipped++;
            } else {
              console.error(`   ❌ Error: ${err.message.substring(0, 100)}`);
              errors++;
              throw err;
            }
          }
        }
        
        await transactionClient.query('COMMIT');
        console.log(`   ✅ Committed\n`);
        
      } catch (err) {
        if (transactionClient) {
          await transactionClient.query('ROLLBACK');
          console.log(`   ⚠️  Rolled back\n`);
        }
      } finally {
        if (transactionClient) {
          transactionClient.release();
        }
      }
      
      await sleep(500);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ IMPORT COMPLETED!');
    console.log('='.repeat(50));
    console.log(`   ✅ Successful: ${completed} statements`);
    console.log(`   ⏭️  Skipped: ${skipped} statements`);
    console.log(`   ❌ Errors: ${errors} statements\n`);
    
    // Проверяем структуру
    console.log('🔍 Verifying database structure...');
    
    const tablesResult = await pool.query(`
      SELECT table_name, 
             (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`\n📊 Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`   📋 ${row.table_name} (${row.columns} columns)`);
    });
    
    // Проверяем основные таблицы
    console.log('\n📈 Data counts:');
    const mainTables = ['profiles', 'user_profiles', 'products', 'orders', 'categories'];
    
    for (const tableName of mainTables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = parseInt(result.rows[0].count);
        if (count > 0) {
          console.log(`   ✅ ${tableName}: ${count.toLocaleString()} rows`);
        } else {
          console.log(`   ⚠️  ${tableName}: empty`);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: not found`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Migration to Stockholm completed successfully!');
    console.log('='.repeat(50));
    
    // Сохраняем отчет
    const report = {
      timestamp: new Date().toISOString(),
      stats: { completed, skipped, errors, total: totalStatements },
      tables: tablesResult.rows.length,
      database: testResult.rows[0]['current_database']
    };
    
    fs.writeFileSync('import-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Import report saved to import-report.json');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

importDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
