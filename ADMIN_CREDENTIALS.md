# 🔐 Учетные данные администратора

## Администратор по умолчанию

После выполнения `init-database.sql` или `create-admin.sql`:

### 📧 Email:
```
admin@example.com
```

### 🔑 Пароль:
```
admin123
```

### 🌐 URL для входа:
```
http://localhost:3000/admin/login
```

---

## ⚠️ ВАЖНО: Безопасность

### После первого входа:

1. **Смените пароль немедленно!**
   - Перейдите в профиль
   - Измените пароль на надежный

2. **Создайте свой аккаунт администратора:**
   - Используйте свой реальный email
   - Установите надежный пароль

3. **Удалите тестового администратора:**
   ```sql
   DELETE FROM users WHERE email = 'admin@example.com';
   ```

---

## 🆕 Создание нового администратора

### Вариант 1: Через SQL (рекомендуется)

1. Сгенерируйте хеш пароля:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('ваш_пароль', 10))"
   ```

2. Выполните в Supabase SQL Editor:
   ```sql
   INSERT INTO users (email, name, password, role) VALUES
     ('ваш_email@example.com', 'Ваше Имя', 'хеш_пароля_здесь', 'admin');
   ```

### Вариант 2: Через API endpoint

Создайте файл `scripts/create-admin.ts`:

```typescript
import bcrypt from 'bcryptjs';
import { db } from '../lib/db';
import { users } from '../lib/schema';

async function createAdmin() {
  const email = 'ваш_email@example.com';
  const password = 'ваш_надежный_пароль';
  const name = 'Ваше Имя';
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await db.insert(users).values({
    email,
    name,
    password: hashedPassword,
    role: 'admin',
  });
  
  console.log('✅ Администратор создан!');
  console.log('Email:', email);
  console.log('Пароль:', password);
}

createAdmin();
```

Запустите:
```bash
npx tsx scripts/create-admin.ts
```

### Вариант 3: Через админ панель (если уже вошли)

1. Войдите как администратор
2. Перейдите в `/admin/users`
3. Создайте нового пользователя
4. Измените роль на `admin` через SQL:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'новый_email@example.com';
   ```

---

## 👥 Роли пользователей

### Доступные роли:

- **`admin`** - Полный доступ ко всем функциям
- **`staff`** - Доступ к админ панели (ограниченный)
- **`customer`** - Обычный пользователь (по умолчанию)

### Изменение роли:

```sql
-- Сделать пользователя администратором
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';

-- Сделать пользователя сотрудником
UPDATE users SET role = 'staff' WHERE email = 'user@example.com';

-- Вернуть роль клиента
UPDATE users SET role = 'customer' WHERE email = 'user@example.com';
```

---

## 🔒 Смена пароля

### Через SQL:

1. Сгенерируйте новый хеш:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('новый_пароль', 10))"
   ```

2. Обновите в БД:
   ```sql
   UPDATE users 
   SET password = 'новый_хеш_пароля' 
   WHERE email = 'admin@example.com';
   ```

### Через приложение:

1. Войдите в систему
2. Перейдите в профиль
3. Используйте форму смены пароля

---

## 📊 Проверка администраторов

### Список всех администраторов:

```sql
SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM users 
WHERE role IN ('admin', 'staff')
ORDER BY created_at DESC;
```

### Количество администраторов:

```sql
SELECT 
  role,
  COUNT(*) as count
FROM users 
GROUP BY role;
```

---

## 🚨 Восстановление доступа

### Если забыли пароль администратора:

1. Подключитесь к Supabase SQL Editor
2. Создайте нового администратора:
   ```sql
   -- Сгенерируйте хеш для пароля "reset123"
   INSERT INTO users (email, name, password, role) VALUES
     ('reset@example.com', 'Reset Admin', '$2b$10$хеш_здесь', 'admin');
   ```

3. Войдите с новыми данными
4. Восстановите или удалите старый аккаунт

---

## 💡 Best Practices

### Для разработки:

✅ Используйте простые пароли (admin123)
✅ Используйте тестовые email адреса
✅ Не храните реальные данные

### Для production:

✅ Используйте надежные пароли (минимум 12 символов)
✅ Используйте реальные email адреса
✅ Включите 2FA (если доступно)
✅ Регулярно меняйте пароли
✅ Ограничьте количество администраторов
✅ Логируйте действия администраторов

---

## 📝 Тестовые пользователи

Для тестирования можно создать дополнительных пользователей:

```sql
-- Тестовый администратор
INSERT INTO users (email, name, password, role) VALUES
  ('admin@test.com', 'Test Admin', '$2b$10$fY21fl7Xda0eUU2dUEny4.524i/MDChX9QB9OnCjDMTzPDGRVW8sy', 'admin');

-- Тестовый сотрудник
INSERT INTO users (email, name, password, role) VALUES
  ('staff@test.com', 'Test Staff', '$2b$10$fY21fl7Xda0eUU2dUEny4.524i/MDChX9QB9OnCjDMTzPDGRVW8sy', 'staff');

-- Тестовый клиент
INSERT INTO users (email, name, password, role) VALUES
  ('customer@test.com', 'Test Customer', '$2b$10$fY21fl7Xda0eUU2dUEny4.524i/MDChX9QB9OnCjDMTzPDGRVW8sy', 'customer');
```

Все с паролем: `admin123`

---

## 🔗 Полезные ссылки

- **Админ панель:** http://localhost:3000/admin
- **Логин:** http://localhost:3000/admin/login
- **Профиль:** http://localhost:3000/admin/settings
- **Пользователи:** http://localhost:3000/admin/users

---

**Готово!** Теперь вы можете войти в админ панель. 🎉

**ВАЖНО:** Не забудьте сменить пароль после первого входа!
