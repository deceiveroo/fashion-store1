const { createClient } = require('@libsql/client');
const fs = require('fs');

// Создаем клиент для работы с локальной базой данных
const client = createClient({
  url: './dev.db',
});

async function initDatabase() {
  console.log('Начинаем инициализацию базы данных...');

  // Удаляем старую базу данных, если она существует
  if (fs.existsSync('./dev.db')) {
    fs.unlinkSync('./dev.db');
    console.log('Старая база данных удалена');
  }

  // Создаем новую базу данных с правильной структурой
  // Выполняем SQL-запросы из файлов миграции
  const migrationFiles = [
    './drizzle/0000_wild_joseph.sql',
    './drizzle/0001_cloudy_midnight.sql',
    './drizzle/0002_sturdy_earthquake.sql',
    './drizzle/0003_colorful_screwball.sql',
    './drizzle/0004_fresh_kid.sql'
  ];

  for (const file of migrationFiles) {
    if (fs.existsSync(file)) {
      console.log(`Выполняем миграцию из файла: ${file}`);
      const sql = fs.readFileSync(file, 'utf8');
      const statements = sql.split('--> statement-breakpoint')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const stmt of statements) {
        if (stmt && !stmt.startsWith('--')) {
          try {
            await client.execute(stmt);
          } catch (err) {
            console.error(`Ошибка при выполнении: ${stmt}`);
            console.error(err.message);
          }
        }
      }
    } else {
      console.log(`Файл миграции не найден: ${file}`);
    }
  }

  console.log('Инициализация базы данных завершена!');
}

// Запускаем инициализацию
initDatabase()
  .then(() => {
    console.log('База данных успешно инициализирована');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Ошибка при инициализации базы данных:', error);
    process.exit(1);
  });