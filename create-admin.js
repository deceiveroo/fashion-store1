 не // Базовая схема для Drizzle ORM
const { text, timestamp, pgTable, uniqueIndex } = require('drizzle-orm/pg-core');

const users = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  name: text('name'),
  email: text('email').notNull(),
  password: text('password'),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  role: text('role').default('user'),
  twoFactorSecret: text('two_factor_secret'),
  lastEditedAt: timestamp('last_edited_at'),
  affinityScores: jsonb('affinity_scores'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

const accounts = pgTable('accounts', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').references(() => users.id),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state')
});

const dbSchema = {
  users,
  accounts
};

module.exports = { dbSchema };
const bcrypt = require('bcryptjs');
const { db } = require('./lib/db');

// Импортируем схему базы данных
const { users } = require('./lib/db/schema');

async function createAdminUser(email, password, role = 'admin', name = 'Admin User') {
  try {
    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Проверяем, существует ли уже пользователь с таким email
    const existingUser = await db.select().from(users).where(
      require('drizzle-orm').eq(users.email, email)
    );
    
    if (existingUser.length > 0) {
      console.log(`⚠ Пользователь с email ${email} уже существует`);
      return existingUser[0];
    }
    
    // Создаем нового пользователя
    const newUser = await db.insert(users).values({
      name: name,
      email: email,
      password: hashedPassword,
      role: role,
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log(`✓ Пользователь ${email} с ролью ${role} успешно создан`);
    return newUser[0];
  } catch (error) {
    console.error('✗ Ошибка при создании администратора:', error.message);
    throw error;
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('Создание учетных записей администраторов...');
  console.log('='.repeat(60));
  
  // Создаем администраторов с разными ролями
  const adminsData = [
    {
      email: 'admin@fashionstore.com',
      password: 'AdminPass123!',
      role: 'admin',
      name: 'Главный администратор'
    },
    {
      email: 'manager@fashionstore.com',
      password: 'ManagerPass123!',
      role: 'manager',
      name: 'Менеджер'
    },
    {
      email: 'support@fashionstore.com',
      password: 'SupportPass123!',
      role: 'support',
      name: 'Служба поддержки'
    }
  ];
  
  for (const adminData of adminsData) {
    await createAdminUser(
      adminData.email,
      adminData.password,
      adminData.role,
      adminData.name
    );
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Готово! Теперь вы можете войти в систему с этими учетными данными:');
  console.log('='.repeat(60));
  console.log('\n📧 Главный администратор: admin@fashionstore.com / AdminPass123!');
  console.log('👔 Менеджер: manager@fashionstore.com / ManagerPass123!');
  console.log('📞 Поддержка: support@fashionstore.com / SupportPass123!');
  console.log('\n' + '='.repeat(60));
  console.log('\n⚠️  ВАЖНО: Сохраните эти данные и измените пароли после первого входа!\n');
}


if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { createAdminUser };
