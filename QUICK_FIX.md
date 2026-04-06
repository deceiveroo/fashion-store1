# ⚡ Быстрое исправление (2 минуты)

## Проблемы:
- ❌ `column "parent_id" does not exist`
- ❌ Query timeouts
- ❌ Аватарки не загружаются

## Решение:

### 1. Откройте Supabase SQL Editor
https://supabase.com/dashboard/project/sjxepisvuthynvixpwii/sql

### 2. Выполните этот SQL (скопируйте всё):

```sql
-- Исправление таблицы categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS materialized_path TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'ru';

-- Исправление таблицы users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Исправление таблицы user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Исправление таблицы products
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- Генерация SKU для существующих товаров
UPDATE products SET sku = 'SKU-' || SUBSTRING(id::text, 1, 8) WHERE sku IS NULL;

-- Добавление индексов
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

SELECT '✅ Основные проблемы исправлены!' as status;
```

### 3. Пересоздайте администратора:

```sql
-- Удаляем старого
DELETE FROM users WHERE email = 'admin@example.com';

-- Создаем нового
INSERT INTO users (
  id, email, name, password, role, status, 
  email_verified, created_at, updated_at
) VALUES (
  gen_random_uuid()::text,
  'admin@example.com',
  'Администратор',
  '$2b$10$eDHm61JA35ergFkTomBxKOGLM0c663RjFr3GSbuOqqophMJnB714m',
  'admin',
  'active',
  NOW(),
  NOW(),
  NOW()
);

SELECT '✅ Администратор создан!' as status;
```

### 4. Перезапустите сервер:

```bash
# Ctrl+C чтобы остановить
npm run dev
```

### 5. Войдите:
- URL: http://localhost:3000/admin/login
- Email: `admin@example.com`
- Пароль: `admin123`

---

## Если нужно больше исправлений:

Выполните полный скрипт:
```
fix-database-schema.sql
```

Он добавит ВСЕ недостающие таблицы и колонки.

---

## Проверка:

```sql
-- Проверьте что колонки добавлены
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'categories' AND column_name = 'parent_id';

-- Должно вернуть: parent_id
```

---

**Готово!** Ошибки должны исчезнуть. 🚀
