# 📦 Миграция данных между базами данных

Полное руководство по копированию данных из старой БД в новую.

---

## 🎯 Варианты миграции

### Вариант 1: pg_dump / pg_restore (рекомендуется)
Самый надежный способ для PostgreSQL.

### Вариант 2: Через Supabase Dashboard
Простой способ через веб-интерфейс.

### Вариант 3: SQL скрипт
Ручное копирование через SQL.

### Вариант 4: Программная миграция
Через Node.js скрипт.

---

## 🔧 Вариант 1: pg_dump / pg_restore (Рекомендуется)

### Шаг 1: Установите PostgreSQL клиент

#### Windows:
```bash
# Скачайте PostgreSQL с официального сайта
https://www.postgresql.org/download/windows/

# Или через Chocolatey
choco install postgresql
```

#### Linux/WSL:
```bash
sudo apt-get update
sudo apt-get install postgresql-client
```

#### macOS:
```bash
brew install postgresql
```

### Шаг 2: Экспорт из старой БД

```bash
# Получите данные подключения из старой Supabase
# Settings → Database → Connection string → Direct connection

# Экспорт всей БД
pg_dump "postgresql://postgres:[PASSWORD]@db.[OLD-PROJECT].supabase.co:5432/postgres" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  -f backup.sql

# Или только данные (без схемы)
pg_dump "postgresql://postgres:[PASSWORD]@db.[OLD-PROJECT].supabase.co:5432/postgres" \
  --data-only \
  --no-owner \
  --no-privileges \
  -f data_only.sql

# Или только определенные таблицы
pg_dump "postgresql://postgres:[PASSWORD]@db.[OLD-PROJECT].supabase.co:5432/postgres" \
  --no-owner \
  --no-privileges \
  -t users -t products -t orders -t order_items \
  -f specific_tables.sql
```

### Шаг 3: Импорт в новую БД

```bash
# Получите данные подключения из новой Supabase
# Settings → Database → Connection string → Direct connection

# Импорт полного бэкапа
psql "postgresql://postgres:[PASSWORD]@db.[NEW-PROJECT].supabase.co:5432/postgres" \
  -f backup.sql

# Или только данные
psql "postgresql://postgres:[PASSWORD]@db.[NEW-PROJECT].supabase.co:5432/postgres" \
  -f data_only.sql
```

### Шаг 4: Проверка

```bash
# Подключитесь к новой БД
psql "postgresql://postgres:[PASSWORD]@db.[NEW-PROJECT].supabase.co:5432/postgres"

# Проверьте количество записей
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items;

# Выход
\q
```

---

## 🌐 Вариант 2: Через Supabase Dashboard

### Шаг 1: Экспорт из старой БД

1. Откройте старый проект в Supabase
2. Перейдите в **SQL Editor**
3. Создайте новый запрос:

```sql
-- Экспорт users
COPY (SELECT * FROM users) TO STDOUT WITH CSV HEADER;

-- Экспорт products
COPY (SELECT * FROM products) TO STDOUT WITH CSV HEADER;

-- Экспорт orders
COPY (SELECT * FROM orders) TO STDOUT WITH CSV HEADER;

-- Экспорт order_items
COPY (SELECT * FROM order_items) TO STDOUT WITH CSV HEADER;
```

4. Сохраните результаты в CSV файлы

### Шаг 2: Импорт в новую БД

1. Откройте новый проект в Supabase
2. Перейдите в **Table Editor**
3. Для каждой таблицы:
   - Откройте таблицу
   - Нажмите "Insert" → "Import data from CSV"
   - Загрузите соответствующий CSV файл

---

## 💻 Вариант 3: SQL скрипт

### Создайте скрипт миграции

Создайте файл `migrate-data.sql`:

```sql
-- Подключение к старой БД через dblink (если поддерживается)
-- Или выполните экспорт/импорт вручную

-- 1. Экспорт users
SELECT * FROM users ORDER BY created_at;

-- 2. Экспорт products
SELECT * FROM products ORDER BY created_at;

-- 3. Экспорт categories
SELECT * FROM categories ORDER BY created_at;

-- 4. Экспорт orders
SELECT * FROM orders ORDER BY created_at;

-- 5. Экспорт order_items
SELECT * FROM order_items ORDER BY created_at;

-- 6. Экспорт user_profiles
SELECT * FROM user_profiles ORDER BY created_at;

-- 7. Экспорт product_images
SELECT * FROM product_images ORDER BY created_at;
```

### Выполнение:

```bash
# Экспорт
psql "OLD_DATABASE_URL" -f migrate-data.sql > exported_data.sql

# Импорт
psql "NEW_DATABASE_URL" -f exported_data.sql
```

---

## 🔨 Вариант 4: Node.js скрипт (Программная миграция)

Создайте файл `scripts/migrate-database.ts`:

```typescript
import { Pool } from 'pg';
import { parseIntoClientConfig } from 'pg-connection-string';

// Старая БД
const oldDbConfig = parseIntoClientConfig(process.env.OLD_DATABASE_URL!);
const oldPool = new Pool({
  ...oldDbConfig,
  ssl: { rejectUnauthorized: false },
});

// Новая БД
const newDbConfig = parseIntoClientConfig(process.env.NEW_DATABASE_URL!);
const newPool = new Pool({
  ...newDbConfig,
  ssl: { rejectUnauthorized: false },
});

async function migrateTable(tableName: string, columns: string[]) {
  console.log(`Migrating ${tableName}...`);
  
  try {
    // Читаем из старой БД
    const { rows } = await oldPool.query(`SELECT * FROM ${tableName} ORDER BY created_at`);
    console.log(`Found ${rows.length} rows in ${tableName}`);
    
    if (rows.length === 0) {
      console.log(`No data to migrate for ${tableName}`);
      return;
    }
    
    // Вставляем в новую БД
    for (const row of rows) {
      const columnNames = columns.join(', ');
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const values = columns.map(col => row[col]);
      
      await newPool.query(
        `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values
      );
    }
    
    console.log(`✅ Migrated ${rows.length} rows to ${tableName}`);
  } catch (error) {
    console.error(`❌ Error migrating ${tableName}:`, error);
    throw error;
  }
}

async function migrate() {
  try {
    console.log('Starting database migration...\n');
    
    // Порядок важен из-за foreign keys!
    
    // 1. Users (независимая таблица)
    await migrateTable('users', [
      'id', 'email', 'name', 'password', 'role', 'image', 'created_at', 'updated_at'
    ]);
    
    // 2. Categories (независимая таблица)
    await migrateTable('categories', [
      'id', 'name', 'slug', 'description', 'image', 'created_at', 'updated_at'
    ]);
    
    // 3. Products (зависит от categories)
    await migrateTable('products', [
      'id', 'name', 'slug', 'description', 'price', 'category_id', 
      'stock', 'image', 'created_at', 'updated_at'
    ]);
    
    // 4. User Profiles (зависит от users)
    await migrateTable('user_profiles', [
      'id', 'user_id', 'phone', 'address', 'city', 'country', 
      'postal_code', 'avatar', 'created_at', 'updated_at'
    ]);
    
    // 5. Product Images (зависит от products)
    await migrateTable('product_images', [
      'id', 'product_id', 'url', 'alt', 'is_primary', 'created_at'
    ]);
    
    // 6. Orders (зависит от users)
    await migrateTable('orders', [
      'id', 'user_id', 'total', 'status', 'created_at', 'updated_at'
    ]);
    
    // 7. Order Items (зависит от orders и products)
    await migrateTable('order_items', [
      'id', 'order_id', 'product_id', 'name', 'price', 'quantity', 
      'image', 'size', 'color', 'created_at'
    ]);
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await oldPool.end();
    await newPool.end();
  }
}

migrate();
```

### Запуск скрипта:

```bash
# Установите зависимости (если еще не установлены)
npm install pg pg-connection-string

# Создайте .env.migration
echo "OLD_DATABASE_URL=postgresql://..." > .env.migration
echo "NEW_DATABASE_URL=postgresql://..." >> .env.migration

# Запустите миграцию
npx dotenv -e .env.migration -- tsx scripts/migrate-database.ts
```

---

## 🔍 Проверка после миграции

### SQL запросы для проверки:

```sql
-- Проверка количества записей
SELECT 
  'users' as table_name, 
  COUNT(*) as count 
FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'product_images', COUNT(*) FROM product_images;

-- Проверка целостности данных
-- Проверка что все orders имеют валидных users
SELECT COUNT(*) as orphaned_orders
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE u.id IS NULL;

-- Проверка что все order_items имеют валидные orders
SELECT COUNT(*) as orphaned_order_items
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL;

-- Проверка что все products имеют валидные categories
SELECT COUNT(*) as orphaned_products
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE c.id IS NULL;
```

---

## ⚠️ Важные замечания

### 1. Порядок миграции

Соблюдайте порядок из-за foreign keys:
1. Users
2. Categories
3. Products
4. User Profiles
5. Product Images
6. Orders
7. Order Items

### 2. Конфликты ID

Если в новой БД уже есть данные:

```sql
-- Используйте ON CONFLICT
INSERT INTO users (...) VALUES (...)
ON CONFLICT (id) DO NOTHING;

-- Или обновляйте существующие
INSERT INTO users (...) VALUES (...)
ON CONFLICT (id) DO UPDATE SET ...;
```

### 3. Sequences (автоинкремент)

После импорта обновите sequences:

```sql
-- Для каждой таблицы с serial/bigserial
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));
```

### 4. Пароли пользователей

Если пароли хешированы bcrypt - они перенесутся как есть.
Если нет - нужно будет пересоздать пароли.

### 5. Изображения

Если изображения хранятся в Supabase Storage:
- Экспортируйте файлы из старого Storage
- Загрузите в новый Storage
- Обновите URL в БД

---

## 🚀 Быстрая миграция (рекомендуемый способ)

### Для Supabase → Supabase:

```bash
# 1. Экспорт
pg_dump "postgresql://postgres:[OLD_PASSWORD]@db.[OLD_PROJECT].supabase.co:5432/postgres" \
  --no-owner --no-privileges --clean --if-exists \
  -f full_backup.sql

# 2. Импорт
psql "postgresql://postgres:[NEW_PASSWORD]@db.[NEW_PROJECT].supabase.co:5432/postgres" \
  -f full_backup.sql

# 3. Проверка
psql "postgresql://postgres:[NEW_PASSWORD]@db.[NEW_PROJECT].supabase.co:5432/postgres" \
  -c "SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'products', COUNT(*) FROM products;"
```

---

## 📝 Чеклист миграции

- [ ] Создан бэкап старой БД
- [ ] Новая БД создана и настроена
- [ ] Схема в новой БД совпадает со старой
- [ ] Данные экспортированы
- [ ] Данные импортированы
- [ ] Проверено количество записей
- [ ] Проверена целостность данных (foreign keys)
- [ ] Обновлены sequences
- [ ] Протестирован вход пользователей
- [ ] Протестированы основные функции
- [ ] Обновлены переменные окружения
- [ ] Старая БД сохранена как бэкап

---

## 🆘 Решение проблем

### Ошибка: "relation does not exist"

Сначала создайте схему:
```bash
# Экспортируйте только схему
pg_dump "OLD_DB_URL" --schema-only -f schema.sql

# Импортируйте схему
psql "NEW_DB_URL" -f schema.sql

# Затем импортируйте данные
psql "NEW_DB_URL" -f data.sql
```

### Ошибка: "duplicate key value"

Используйте ON CONFLICT:
```sql
INSERT INTO users (...) VALUES (...)
ON CONFLICT (id) DO NOTHING;
```

### Ошибка: "permission denied"

Используйте --no-owner и --no-privileges:
```bash
pg_dump "OLD_DB_URL" --no-owner --no-privileges -f backup.sql
```

---

## 💡 Рекомендации

1. **Всегда делайте бэкап** перед миграцией
2. **Тестируйте на копии** перед production
3. **Проверяйте целостность** после миграции
4. **Сохраняйте старую БД** минимум неделю
5. **Документируйте процесс** для будущих миграций

---

**Готово!** Ваши данные успешно мигрированы. 🎉
