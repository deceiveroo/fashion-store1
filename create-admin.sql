-- Создание администратора для Fashion Store
-- Выполните этот скрипт в Supabase SQL Editor ПОСЛЕ init-database.sql

-- Удаляем старого администратора если есть
DELETE FROM users WHERE email = 'admin@example.com';

-- Создаем нового администратора
-- Email: admin@example.com
-- Пароль: admin123
INSERT INTO users (id, email, name, password, role, created_at, updated_at) VALUES
  (
    gen_random_uuid(),
    'admin@example.com',
    'Администратор',
    '$2b$10$fY21fl7Xda0eUU2dUEny4.524i/MDChX9QB9OnCjDMTzPDGRVW8sy',
    'admin',
    NOW(),
    NOW()
  );

-- Проверка
SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM users 
WHERE role = 'admin';

-- Готово!
SELECT 'Администратор создан! Email: admin@example.com, Пароль: admin123' as message;
