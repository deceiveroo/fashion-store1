// create-test-users.js
// Запустите: node create-test-users.js

require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

// Подключение к базе данных
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createUsers() {
  console.log('🔌 Подключение к базе данных...');
  
  try {
    await client.connect();
    console.log('✅ Подключено!');

    // Генерируем хеши паролей
    const adminPassword = await bcrypt.hash('admin123', 10);
    const managerPassword = await bcrypt.hash('manager123', 10);
    const supportPassword = await bcrypt.hash('support123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);

    console.log('\n📝 Создание пользователей...\n');

    // Создаем админа
    await client.query(`
      INSERT INTO users (id, email, name, password, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = NOW()
    `, [
      'admin-001',
      'admin@fashion-store.com',
      'Главный Администратор',
      adminPassword,
      'admin',
      'active'
    ]);
    console.log('✅ Admin создан: admin@fashion-store.com / admin123');

    // Создаем менеджера
    await client.query(`
      INSERT INTO users (id, email, name, password, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = NOW()
    `, [
      'manager-001',
      'manager@fashion-store.com',
      'Менеджер Магазина',
      managerPassword,
      'manager',
      'active'
    ]);
    console.log('✅ Manager создан: manager@fashion-store.com / manager123');

    // Создаем поддержку
    await client.query(`
      INSERT INTO users (id, email, name, password, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = NOW()
    `, [
      'support-001',
      'support@fashion-store.com',
      'Служба Поддержки',
      supportPassword,
      'support',
      'active'
    ]);
    console.log('✅ Support создан: support@fashion-store.com / support123');

    // Создаем покупателя
    await client.query(`
      INSERT INTO users (id, email, name, password, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = NOW()
    `, [
      'customer-001',
      'customer@test.com',
      'Тестовый Покупатель',
      customerPassword,
      'customer',
      'active'
    ]);
    console.log('✅ Customer создан: customer@test.com / customer123');

    // Проверяем что пользователи созданы
    console.log('\n📊 Проверка созданных пользователей:\n');
    const result = await client.query(`
      SELECT id, email, name, role, status, 
             CASE 
               WHEN password IS NOT NULL AND length(password) > 20 THEN '✅ Пароль установлен'
               ELSE '❌ Пароль НЕ установлен'
             END as password_status
      FROM users
      WHERE email IN (
        'admin@fashion-store.com',
        'manager@fashion-store.com',
        'support@fashion-store.com',
        'customer@test.com'
      )
      ORDER BY 
        CASE role
          WHEN 'admin' THEN 1
          WHEN 'manager' THEN 2
          WHEN 'support' THEN 3
          WHEN 'customer' THEN 4
        END
    `);

    console.table(result.rows);

    console.log('\n🎉 ГОТОВО! Теперь можно войти:\n');
    console.log('Email: admin@fashion-store.com / Пароль: admin123');
    console.log('Email: manager@fashion-store.com / Пароль: manager123');
    console.log('Email: support@fashion-store.com / Пароль: support123');
    console.log('Email: customer@test.com / Пароль: customer123\n');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error('Details:', error);
  } finally {
    await client.end();
    console.log('🔌 Отключено от базы данных');
  }
}

createUsers();
