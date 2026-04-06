import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';
import { users, categories, products, productImages, productCategory } from './db/schema';

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1111',
    database: process.env.DB_NAME || 'shop_db',
  });

  const db = drizzle(connection);

  console.log('Starting migration...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migration completed!');
  
  await connection.end();
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});