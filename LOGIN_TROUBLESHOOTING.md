# 🔧 Решение проблем со входом в админ панель

## Проблема: "Неверный пароль" при входе

### Быстрое решение (3 шага):

#### 1️⃣ Откройте Supabase SQL Editor
Перейдите: https://supabase.com/dashboard/project/sjxepisvuthynvixpwii/sql

#### 2️⃣ Выполните скрипт проверки
Скопируйте и выполните содержимое файла `verify-admin.sql`

Это покажет:
- Существует ли пользователь admin@example.com
- Правильно ли установлена роль
- Корректен ли хеш пароля

#### 3️⃣ Пересоздайте администратора
Скопируйте и выполните содержимое файла `reset-admin-password.sql`

Это:
- Удалит старого администратора
- Создаст нового с правильным UUID и хешем пароля
- Установит все необходимые поля

---

## Учетные данные для входа

После выполнения `reset-admin-password.sql`:

```
Email:    admin@example.com
Пароль:   admin123
URL:      http://localhost:3000/admin/login
```

---

## Возможные причины ошибки

### 1. Неправильный хеш пароля
**Симптом:** Пароль не совпадает даже при правильном вводе

**Причина:** Пароль в БД не захеширован или захеширован неправильно

**Решение:**
```sql
-- Выполните в Supabase SQL Editor
UPDATE users 
SET password = '$2b$10$eDHm61JA35ergFkTomBxKOGLM0c663RjFr3GSbuOqqophMJnB714m'
WHERE email = 'admin@example.com';
```

### 2. Неправильная роль
**Симптом:** "Нет прав staff" или "Неверный email или пароль"

**Причина:** Роль пользователя не `admin`, `manager` или `support`

**Решение:**
```sql
-- Выполните в Supabase SQL Editor
UPDATE users 
SET role = 'admin'
WHERE email = 'admin@example.com';
```

### 3. Отсутствует UUID
**Симптом:** Ошибка при создании пользователя

**Причина:** Поле `id` не заполнено или заполнено неправильно

**Решение:**
```sql
-- Используйте gen_random_uuid() для генерации UUID
INSERT INTO users (id, email, name, password, role, status, created_at, updated_at)
VALUES (
  gen_random_uuid()::text,
  'admin@example.com',
  'Администратор',
  '$2b$10$eDHm61JA35ergFkTomBxKOGLM0c663RjFr3GSbuOqqophMJnB714m',
  'admin',
  'active',
  NOW(),
  NOW()
);
```

### 4. Статус пользователя неактивен
**Симптом:** Вход не работает даже с правильными данными

**Причина:** Поле `status` не установлено в `active`

**Решение:**
```sql
UPDATE users 
SET status = 'active'
WHERE email = 'admin@example.com';
```

---

## Проверка после исправления

### 1. Проверьте данные в БД
```sql
SELECT 
  id,
  email,
  name,
  role,
  status,
  LENGTH(password) as password_length,
  created_at
FROM users 
WHERE email = 'admin@example.com';
```

**Ожидаемый результат:**
- `id`: UUID (например, `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
- `email`: `admin@example.com`
- `role`: `admin`
- `status`: `active`
- `password_length`: `60` (bcrypt хеш всегда 60 символов)

### 2. Проверьте логи сервера
Запустите dev сервер и посмотрите логи:
```bash
npm run dev
```

При попытке входа вы должны увидеть:
```
[AUTH] authorize called
[AUTH] Email: admin@example.com
[AUTH] User found: true id=...
[AUTH] Comparing password...
[AUTH] Password match: true
[AUTH] Role: admin
[AUTH] Success! Returning user object
```

### 3. Попробуйте войти
1. Откройте http://localhost:3000/admin/login
2. Введите:
   - Email: `admin@example.com`
   - Пароль: `admin123`
3. Нажмите "Войти"

---

## Альтернативный метод: Создание через Node.js

Если SQL скрипты не работают, создайте администратора через Node.js:

### Создайте файл `scripts/create-admin.ts`:

```typescript
import bcrypt from 'bcryptjs';
import { db } from '../lib/db';
import { users } from '../lib/schema';
import { randomUUID } from 'crypto';

async function createAdmin() {
  const email = 'admin@example.com';
  const password = 'admin123';
  const name = 'Администратор';
  
  // Генерируем хеш пароля
  const hashedPassword = await bcrypt.hash(password, 10);
  
  console.log('Создание администратора...');
  console.log('Email:', email);
  console.log('Пароль:', password);
  console.log('Хеш:', hashedPassword);
  
  try {
    // Удаляем старого администратора
    await db.delete(users).where(eq(users.email, email));
    
    // Создаем нового
    const [user] = await db.insert(users).values({
      id: randomUUID(),
      email,
      name,
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    console.log('✅ Администратор создан успешно!');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Роль:', user.role);
  } catch (error) {
    console.error('❌ Ошибка при создании администратора:', error);
    throw error;
  }
}

createAdmin()
  .then(() => {
    console.log('Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Ошибка:', error);
    process.exit(1);
  });
```

### Запустите скрипт:

```bash
npx tsx scripts/create-admin.ts
```

---

## Проверка NextAuth конфигурации

Убедитесь, что в `.env.local` установлены правильные переменные:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=vfTKbG0txd85PzIQq9riJjNZkApWg0zVw/OqywcqvJQ=

# Database
DATABASE_URL=postgres://postgres.sjxepisvuthynvixpwii:7gWa6KSOYpPTSanP@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

---

## Отладка в браузере

### 1. Откройте DevTools (F12)
### 2. Перейдите на вкладку Network
### 3. Попробуйте войти
### 4. Найдите запрос к `/api/auth/callback/credentials`

**Если статус 200:** Вход успешен, проблема в редиректе
**Если статус 401:** Неверные учетные данные
**Если статус 500:** Ошибка сервера, проверьте логи

---

## Тестирование хеша пароля

Проверьте, что хеш пароля правильный:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.compare('admin123', '\$2b\$10\$eDHm61JA35ergFkTomBxKOGLM0c663RjFr3GSbuOqqophMJnB714m').then(console.log)"
```

**Ожидаемый результат:** `true`

---

## Если ничего не помогает

### 1. Полная очистка и пересоздание

```sql
-- Удалите всех пользователей (ОСТОРОЖНО!)
TRUNCATE users CASCADE;

-- Выполните init-database.sql заново
-- Затем выполните reset-admin-password.sql
```

### 2. Проверьте версии пакетов

```bash
npm list bcryptjs next-auth
```

Должно быть:
- `bcryptjs@^3.0.3` или выше
- `next-auth@^5.0.0-beta.25` или выше

### 3. Перезапустите dev сервер

```bash
# Остановите сервер (Ctrl+C)
# Очистите кеш Next.js
rm -rf .next

# Запустите заново
npm run dev
```

---

## Контрольный список

- [ ] Пользователь `admin@example.com` существует в БД
- [ ] Роль установлена в `admin`
- [ ] Статус установлен в `active`
- [ ] Хеш пароля имеет длину 60 символов
- [ ] Поле `id` содержит валидный UUID
- [ ] `NEXTAUTH_SECRET` установлен в `.env.local`
- [ ] `DATABASE_URL` правильный
- [ ] Dev сервер перезапущен после изменений
- [ ] В логах сервера видно `[AUTH] Password match: true`

---

## Успешный вход

После успешного входа вы увидите:

1. Редирект на `/admin/dashboard`
2. В логах: `[AUTH] Success! Returning user object`
3. Админ панель с вашим именем в шапке

---

## Дополнительная помощь

Если проблема сохраняется:

1. Выполните `verify-admin.sql` и отправьте результаты
2. Проверьте логи сервера при попытке входа
3. Проверьте Network tab в DevTools
4. Убедитесь, что база данных доступна

---

**Готово!** Теперь вы должны успешно войти в админ панель. 🎉
