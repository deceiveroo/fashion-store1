# 🆕 Настройка новой Supabase БД

## ✅ Шаг 1: Переменные окружения настроены

Файл `.env.local` уже создан с вашими данными Supabase:

```bash
DATABASE_URL=postgres://postgres.sjxepisvuthynvixpwii:7gWa6KSOYpPTSanP@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
DATABASE_PASSWORD=7gWa6KSOYpPTSanP
SUPABASE_URL=https://sjxepisvuthynvixpwii.supabase.co
NEXTAUTH_SECRET=vfTKbG0txd85PzIQq9riJjNZkApWg0zVw/OqywcqvJQ=
```

---

## 🗄️ Шаг 2: Инициализация базы данных

### Вариант A: Через Supabase SQL Editor (рекомендуется)

1. Откройте ваш проект Supabase:
   ```
   https://supabase.com/dashboard/project/sjxepisvuthynvixpwii
   ```

2. Перейдите в **SQL Editor** (левое меню)

3. Нажмите **New Query**

4. Скопируйте содержимое файла `init-database.sql`

5. Вставьте в редактор и нажмите **Run**

6. Дождитесь сообщения: "Database initialized successfully!"

### Вариант B: Через psql (командная строка)

```bash
psql "postgres://postgres.sjxepisvuthynvixpwii:7gWa6KSOYpPTSanP@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require" -f init-database.sql
```

---

## 👤 Шаг 3: Создание первого администратора

После инициализации БД создайте администратора:

### Через приложение:

1. Запустите dev server:
   ```bash
   npm run dev
   ```

2. Откройте: http://localhost:3000/admin/login

3. Используйте временные данные:
   - Email: `admin@example.com`
   - Password: `admin123`

4. **ВАЖНО:** Сразу смените пароль после первого входа!

### Или создайте нового администратора через SQL:

```sql
-- Сгенерируйте хеш пароля
-- Используйте онлайн генератор bcrypt или Node.js:
-- node -e "console.log(require('bcryptjs').hashSync('ваш_пароль', 10))"

INSERT INTO users (email, name, password, role) VALUES
  ('ваш_email@example.com', 'Ваше Имя', 'bcrypt_хеш_пароля', 'admin');
```

---

## 📊 Шаг 4: Добавление тестовых данных (опционально)

### Добавить продукты:

```sql
-- Получите ID категории
SELECT id, name FROM categories;

-- Добавьте продукты
INSERT INTO products (name, slug, description, price, category_id, stock, image) VALUES
  ('Классическая рубашка', 'classic-shirt', 'Элегантная белая рубашка', 2999.00, 'id_категории_мужская_одежда', 50, '/images/shirt.jpg'),
  ('Джинсы Slim Fit', 'slim-jeans', 'Стильные джинсы', 4999.00, 'id_категории_мужская_одежда', 30, '/images/jeans.jpg'),
  ('Платье вечернее', 'evening-dress', 'Роскошное вечернее платье', 8999.00, 'id_категории_женская_одежда', 20, '/images/dress.jpg');
```

---

## 🔍 Шаг 5: Проверка подключения

### Проверьте через приложение:

```bash
# Запустите dev server
npm run dev

# Откройте в браузере
http://localhost:3000

# Проверьте API
http://localhost:3000/api/products
http://localhost:3000/api/categories
```

### Проверьте через SQL:

```sql
-- Проверка таблиц
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Проверка данных
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'products', COUNT(*) FROM products;
```

---

## 🔐 Шаг 6: Настройка Row Level Security (RLS)

RLS уже настроен в `init-database.sql`, но проверьте:

1. Откройте **Authentication** → **Policies** в Supabase Dashboard

2. Убедитесь, что политики созданы для всех таблиц

3. Если нужно, отключите RLS для разработки:
   ```sql
   -- ТОЛЬКО ДЛЯ РАЗРАБОТКИ!
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE products DISABLE ROW LEVEL SECURITY;
   -- и т.д.
   ```

---

## 🚀 Шаг 7: Запуск приложения

```bash
# Установите зависимости (если еще не установлены)
npm install

# Запустите dev server
npm run dev

# Откройте в браузере
http://localhost:3000
```

---

## 📝 Шаг 8: Тестирование

### Проверьте основные функции:

- [ ] Главная страница загружается
- [ ] Категории отображаются
- [ ] Продукты загружаются
- [ ] Можно зарегистрироваться
- [ ] Можно войти как администратор
- [ ] Админ панель доступна
- [ ] API endpoints работают

### Тестовые запросы:

```bash
# Получить категории
curl http://localhost:3000/api/categories

# Получить продукты
curl http://localhost:3000/api/products

# Проверить здоровье БД
curl http://localhost:3000/api/db-check
```

---

## 🔄 Миграция данных из старой БД (если есть бэкап)

Если у вас есть бэкап старой БД:

### 1. Экспорт из бэкапа:

```bash
# Если есть SQL файл
psql "ваш_новый_DATABASE_URL" -f backup.sql
```

### 2. Или выборочный импорт:

```sql
-- Скопируйте данные из CSV или JSON
COPY users FROM '/path/to/users.csv' CSV HEADER;
COPY products FROM '/path/to/products.csv' CSV HEADER;
```

---

## ⚙️ Настройка для Vercel

Когда будете деплоить на Vercel, добавьте эти переменные:

```bash
DATABASE_URL=postgres://postgres.sjxepisvuthynvixpwii:7gWa6KSOYpPTSanP@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
DATABASE_PASSWORD=7gWa6KSOYpPTSanP
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=vfTKbG0txd85PzIQq9riJjNZkApWg0zVw/OqywcqvJQ=
NODE_TLS_REJECT_UNAUTHORIZED=0
```

---

## 🆘 Решение проблем

### Ошибка: "relation does not exist"

Выполните `init-database.sql` еще раз.

### Ошибка: "password authentication failed"

Проверьте `DATABASE_PASSWORD` в `.env.local`.

### Ошибка: "connection timeout"

Проверьте, что используете Connection Pooling URL (порт 6543).

### Ошибка: "SSL connection required"

Добавьте `?sslmode=require` в конец DATABASE_URL.

---

## 📚 Полезные ссылки

- **Ваш проект:** https://supabase.com/dashboard/project/sjxepisvuthynvixpwii
- **SQL Editor:** https://supabase.com/dashboard/project/sjxepisvuthynvixpwii/sql
- **Table Editor:** https://supabase.com/dashboard/project/sjxepisvuthynvixpwii/editor
- **Database Settings:** https://supabase.com/dashboard/project/sjxepisvuthynvixpwii/settings/database

---

## ✅ Чеклист

- [ ] `.env.local` создан с правильными данными
- [ ] `init-database.sql` выполнен в Supabase
- [ ] Таблицы созданы
- [ ] Администратор создан
- [ ] Dev server запускается
- [ ] Приложение подключается к БД
- [ ] API endpoints работают
- [ ] Можно войти в админ панель

---

**Готово!** Ваша новая БД настроена и готова к работе. 🎉

Следующий шаг: Добавьте продукты и контент через админ панель.
