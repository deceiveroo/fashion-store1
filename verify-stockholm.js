const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.norjvtaujxlbdbqgkmwd:12Laki345Nikita-@aws-1-eu-north-1.pooler.supabase.com:5432/postgres',
  ssl: { 
    rejectUnauthorized: false 
  },
});

async function verifyData() {
  console.log('🔍 Verifying imported data in Stockholm...\n');
  
  try {
    // Проверяем подключение
    const testResult = await pool.query('SELECT current_database(), current_user');
    console.log(`✅ Connected to: ${testResult.rows[0]['current_database']}\n`);
    
    // Получаем список таблиц
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`📊 Found ${tablesResult.rows.length} tables:\n`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Проверяем основные таблицы
    console.log('\n📈 Data counts:');
    const mainTables = ['profiles', 'user_profiles', 'products', 'orders', 'categories', 'wishlists', 'coupons'];
    
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
        console.log(`   ❌ ${tableName}: not found (${err.message.substring(0, 50)})`);
      }
    }
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyData();
