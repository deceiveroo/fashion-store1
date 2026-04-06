-- ============================================
-- ПОСЛЕДНИЙ ШАНС - ПОЛНАЯ ОЧИСТКА
-- ============================================
-- Выполните этот скрипт В SUPABASE SQL EDITOR!
-- https://supabase.com/dashboard/project/sjxepisvuthynvixpwii/sql

-- 1. УДАЛЯЕМ ПРОБЛЕМНОГО ПОЛЬЗОВАТЕЛЯ
DELETE FROM user_profiles WHERE user_id = 'a1929434-a0c0-4521-a4ab-051d129d4b6e';
DELETE FROM sessions WHERE user_id = 'a1929434-a0c0-4521-a4ab-051d129d4b6e';
DELETE FROM accounts WHERE user_id = 'a1929434-a0c0-4521-a4ab-051d129d4b6e';
DELETE FROM cart_items WHERE user_id = 'a1929434-a0c0-4521-a4ab-051d129d4b6e';
DELETE FROM user_wishlist_items WHERE user_id = 'a1929434-a0c0-4521-a4ab-051d129d4b6e';
DELETE FROM orders WHERE user_id = 'a1929434-a0c0-4521-a4ab-051d129d4b6e';
DELETE FROM users WHERE id = 'a1929434-a0c0-4521-a4ab-051d129d4b6e';

-- 2. УДАЛЯЕМ СТАРОГО АДМИНИСТРАТОРА
DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email = 'admin@example.com');
DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = 'admin@example.com');
DELETE FROM users WHERE email = 'admin@example.com';

-- 3. ОЧИЩАЕМ ВСЕ СЕССИИ
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE accounts CASCADE;

-- 4. СОЗДАЕМ НОВОГО АДМИНИСТРАТОРА
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Генерируем новый UUID
  new_user_id := gen_random_uuid();
  
  -- Создаем пользователя
  INSERT INTO users (
    id, email, name, password, role, status, 
    email_verified, created_at, updated_at
  ) VALUES (
    new_user_id,
    'admin@example.com',
    'Администратор',
    '$2b$10$eDHm61JA35ergFkTomBxKOGLM0c663RjFr3GSbuOqqophMJnB714m',
    'admin',
    'active',
    NOW(),
    NOW(),
    NOW()
  );
  
  -- Создаем профиль
  INSERT INTO user_profiles (
    id, user_id, first_name, last_name, 
    created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    'Админ',
    'Администратор',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Новый администратор создан с ID: %', new_user_id;
END $$;

-- 5. ПРОВЕРКА
SELECT 
  '✅ ПРОВЕРКА ЗАВЕРШЕНА' as status,
  (SELECT COUNT(*) FROM users WHERE id = 'a1929434-a0c0-4521-a4ab-051d129d4b6e') as old_user_exists,
  (SELECT COUNT(*) FROM users WHERE email = 'admin@example.com') as new_admin_exists,
  (SELECT id FROM users WHERE email = 'admin@example.com') as new_admin_id,
  (SELECT COUNT(*) FROM sessions) as sessions_count;

-- 6. ПОКАЗЫВАЕМ НОВОГО АДМИНИСТРАТОРА
SELECT 
  '📋 НОВЫЙ АДМИНИСТРАТОР' as info,
  id,
  email,
  name,
  role,
  status,
  email_verified,
  created_at
FROM users 
WHERE email = 'admin@example.com';

-- 7. ФИНАЛЬНОЕ СООБЩЕНИЕ
SELECT 
  '✅ SQL СКРИПТ ВЫПОЛНЕН!' as step_1,
  'Теперь:' as step_2,
  '1. Нажмите F12 в браузере' as step_3,
  '2. Application → Cookies → Clear All' as step_4,
  '3. Закройте ВСЕ вкладки браузера' as step_5,
  '4. Ctrl+C в терминале, затем npm run dev' as step_6,
  '5. Откройте http://localhost:3000/admin/login' as step_7,
  '6. Войдите: admin@example.com / admin123' as step_8;
