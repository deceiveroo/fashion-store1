-- Проверка администратора в базе данных
-- Этот скрипт поможет диагностировать проблемы с входом

-- 1. Проверяем существование пользователя
SELECT 
  '=== ПРОВЕРКА ПОЛЬЗОВАТЕЛЯ ===' as section;

SELECT 
  id,
  email,
  name,
  role,
  status,
  email_verified,
  created_at,
  LENGTH(password) as password_hash_length,
  SUBSTRING(password, 1, 10) as password_hash_start
FROM users 
WHERE email = 'admin@example.com';

-- 2. Проверяем все роли в системе
SELECT 
  '=== ВСЕ РОЛИ В СИСТЕМЕ ===' as section;

SELECT 
  role,
  COUNT(*) as count
FROM users 
GROUP BY role
ORDER BY count DESC;

-- 3. Проверяем всех администраторов
SELECT 
  '=== ВСЕ АДМИНИСТРАТОРЫ ===' as section;

SELECT 
  id,
  email,
  name,
  role,
  status,
  created_at
FROM users 
WHERE role IN ('admin', 'manager', 'support')
ORDER BY created_at DESC;

-- 4. Проверяем структуру таблицы users
SELECT 
  '=== СТРУКТУРА ТАБЛИЦЫ USERS ===' as section;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 5. Подсказки для решения проблем
SELECT 
  '=== ПОДСКАЗКИ ===' as section;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com') 
    THEN '✅ Пользователь admin@example.com существует'
    ELSE '❌ Пользователь admin@example.com НЕ найден - выполните reset-admin-password.sql'
  END as user_check,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com' AND role = 'admin') 
    THEN '✅ Роль admin установлена правильно'
    ELSE '❌ Роль admin НЕ установлена - проверьте роль пользователя'
  END as role_check,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com' AND LENGTH(password) > 50) 
    THEN '✅ Хеш пароля выглядит корректно'
    ELSE '❌ Хеш пароля слишком короткий - возможно пароль не захеширован'
  END as password_check;
