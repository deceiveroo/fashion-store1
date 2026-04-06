# ⚡ Быстрое исправление входа в админ панель

## Проблема
При входе с `admin@example.com` / `admin123` появляется ошибка "Неверный пароль"

## Решение (2 минуты)

### Шаг 1: Откройте Supabase SQL Editor
🔗 https://supabase.com/dashboard/project/sjxepisvuthynvixpwii/sql

### Шаг 2: Выполните этот SQL скрипт

Скопируйте и вставьте в SQL Editor, затем нажмите "Run":

```sql
-- Удаляем старого администратора
DELETE FROM users WHERE email = 'admin@example.com';

-- Создаем нового с правильным UUID и хешем пароля
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

-- Проверка
SELECT 
  id,
  email,
  name,
  role,
  status,
  LENGTH(password) as password_hash_length
FROM users 
WHERE email = 'admin@example.com';
```

### Шаг 3: Войдите в админ панель

1. Откройте: http://localhost:3000/admin/login
2. Введите:
   - **Email:** `admin@example.com`
   - **Пароль:** `admin123`
3. Нажмите "Войти"

---

## ✅ Готово!

Теперь вход должен работать. Вы будете перенаправлены на `/admin/dashboard`.

---

## Если всё ещё не работает

### Вариант 1: Используйте готовый скрипт
Выполните в Supabase SQL Editor содержимое файла:
```
reset-admin-password.sql
```

### Вариант 2: Проверьте проблему
Выполните в Supabase SQL Editor содержимое файла:
```
verify-admin.sql
```

Это покажет, в чём именно проблема.

### Вариант 3: Полная инструкция
Откройте файл `LOGIN_TROUBLESHOOTING.md` для детальной диагностики.

---

## Важные файлы

- `reset-admin-password.sql` - Пересоздание администратора
- `verify-admin.sql` - Проверка состояния БД
- `LOGIN_TROUBLESHOOTING.md` - Полное руководство по решению проблем
- `ADMIN_CREDENTIALS.md` - Информация об учетных данных

---

## Учетные данные

```
Email:    admin@example.com
Пароль:   admin123
URL:      http://localhost:3000/admin/login
```

**⚠️ ВАЖНО:** Смените пароль после первого входа!

---

## Что было исправлено

1. ✅ Добавлен правильный UUID для поля `id`
2. ✅ Установлен корректный bcrypt хеш пароля (60 символов)
3. ✅ Установлена роль `admin` (требуется для входа)
4. ✅ Установлен статус `active`
5. ✅ Добавлено поле `email_verified`
6. ✅ Установлены временные метки `created_at` и `updated_at`

---

**Готово!** Вход в админ панель должен работать. 🚀
