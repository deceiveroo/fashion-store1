-- ============================================
-- ПОЛНАЯ ОЧИСТКА И ПЕРЕСОЗДАНИЕ АДМИНИСТРАТОРА
-- ============================================

-- 1. Удаляем все сессии (очистка NextAuth)
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE accounts CASCADE;
TRUNCATE TABLE verification_tokens CASCADE;

-- 2. Удаляем старого администратора и все связанные данные
DELETE FROM users WHERE email = 'admin@example.com';
DELETE FROM users WHERE id = 'a1929434-a0c0-4521-a4ab-051d129d4b6e';

-- 3. Создаем нового администратора с правильным UUID
INSERT INTO users (
  id,
  email,
  name,
  password,
  role,
  status,
  email_verified,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@example.com',
  'Администратор',
  '$2b$10$eDHm61JA35ergFkTomBxKOGLM0c663RjFr3GSbuOqqophMJnB714m',
  'admin',
  'active',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  email_verified = EXCLUDED.email_verified,
  updated_at = NOW();

-- 4. Проверяем созданного пользователя
SELECT 
  '✅ АДМИНИСТРАТОР СОЗДАН' as status,
  id,
  email,
  name,
  role,
  status,
  email_verified,
  created_at
FROM users 
WHERE email = 'admin@example.com';

-- 5. Показываем учетные данные
SELECT 
  '📧 Email: admin@example.com' as credential_1,
  '🔑 Пароль: admin123' as credential_2,
  '🌐 URL: http://localhost:3000/admin/login' as credential_3;

-- 6. Проверяем что старый пользователь удален
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM users WHERE id = 'a1929434-a0c0-4521-a4ab-051d129d4b6e')
    THEN '✅ Старый пользователь удален'
    ELSE '❌ Старый пользователь еще существует'
  END as cleanup_status;

-- ============================================
-- ГОТОВО!
-- ============================================

SELECT 
  '✅ Очистка завершена!' as status,
  'Теперь:' as step_1,
  '1. Очистите cookies в браузере (F12 → Application → Cookies → Clear All)' as step_2,
  '2. Перезапустите dev сервер (Ctrl+C, затем npm run dev)' as step_3,
  '3. Войдите заново: admin@example.com / admin123' as step_4;
