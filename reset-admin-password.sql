-- Сброс пароля администратора
-- Пароль: admin123
-- Хеш сгенерирован с помощью bcrypt (10 раундов)

-- Удаляем старого администратора (если существует)
DELETE FROM users WHERE email = 'admin@example.com';

-- Создаем нового администратора с правильным UUID и хешем пароля
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

-- Проверка созданного пользователя
SELECT 
  id,
  email,
  name,
  role,
  status,
  email_verified,
  created_at,
  LENGTH(password) as password_hash_length
FROM users 
WHERE email = 'admin@example.com';

-- Сообщение об успехе
SELECT '✅ Администратор создан успешно!' as status,
       'Email: admin@example.com' as email,
       'Пароль: admin123' as password,
       'URL: http://localhost:3000/admin/login' as login_url;
