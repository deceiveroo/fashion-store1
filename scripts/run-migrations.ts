import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '../lib/db';

async function runMigrations() {
  console.log('Запуск миграций базы данных...');
  
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Миграции успешно выполнены!');
  } catch (error) {
    console.error('Ошибка при выполнении миграций:', error);
    process.exit(1);
  }
}

runMigrations();