-- Исправление таблицы users
-- Добавление недостающих колонок

-- Добавляем email_verified
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP WITH TIME ZONE;

-- Добавляем status
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Проверка структуры таблицы
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Проверка администратора
SELECT id, email, name, role, status FROM users WHERE role = 'admin';

SELECT '✅ Таблица users исправлена!' as message;
