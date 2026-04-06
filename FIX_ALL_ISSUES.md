# 🔧 Исправление всех проблем

## Проблемы из логов:

1. ❌ `column "parent_id" does not exist` - не хватает колонок в таблице categories
2. ❌ `Query read timeout` - медленные запросы к БД
3. ❌ `JWTSessionError` - пользователь не найден или запросы таймаутят
4. ❌ Аватарки не загружаются - проблемы со структурой таблиц

---

## ⚡ Быстрое решение (5 минут)

### Шаг 1: Откройте Supabase SQL Editor
🔗 https://supabase.com/dashboard/project/sjxepisvuthynvixpwii/sql

### Шаг 2: Выполните скрипт исправления
Скопируйте и выполните содержимое файла:
```
fix-database-schema.sql
```

Этот скрипт:
- ✅ Добавит все недостающие колонки
- ✅ Создаст недостающие таблицы
- ✅ Добавит индексы для производительности
- ✅ Настроит RLS политики
- ✅ Исправит несоответствия между схемой и БД

### Шаг 3: Пересоздайте администратора
Выполните:
```
reset-admin-password.sql
```

### Шаг 4: Перезапустите dev сервер
```bash
# Остановите сервер (Ctrl+C)
npm run dev
```

---

## 📊 Что было исправлено

### 1. Таблица `users`
Добавлены колонки:
- `email_verified` - для подтверждения email
- `status` - статус пользователя (active/banned)

### 2. Таблица `categories`
Добавлены колонки:
- `parent_id` - для вложенных категорий
- `materialized_path` - путь в дереве категорий
- `position` - порядок сортировки
- `is_featured` - избранная категория
- `locale` - язык (ru/en)

### 3. Таблица `products`
Добавлены колонки:
- `short_description` - краткое описание
- `sku` - артикул товара
- `compare_at_price` - старая цена (для скидок)
- `cost` - себестоимость
- `weight` - вес товара
- `in_stock` - в наличии
- `featured` - избранный товар
- `deleted_at` - мягкое удаление
- `seo_title` - SEO заголовок
- `seo_desc` - SEO описание

### 4. Таблица `user_profiles`
Добавлены колонки:
- `first_name` - имя
- `last_name` - фамилия

### 5. Таблица `product_images`
Исправлена колонка:
- `is_primary` → `is_main`
- Добавлена `order` - порядок изображений

### 6. Таблица `orders`
Добавлены колонки:
- `discount` - скидка
- `delivery_price` - стоимость доставки
- `delivery_method` - способ доставки
- `payment_method` - способ оплаты
- `recipient` - данные получателя (JSON)
- `comment` - комментарий к заказу

### 7. Новые таблицы
Созданы:
- `product_variants` - варианты товаров (размеры, цвета)
- `product_category` - связь товаров и категорий (многие-ко-многим)
- `sessions` - сессии NextAuth
- `accounts` - OAuth аккаунты
- `verification_tokens` - токены верификации
- `cart_items` - корзина покупок
- `user_wishlist_items` - избранное
- `coupons` - купоны и промокоды
- `settings` - настройки сайта
- `activity_logs` - логи действий

---

## 🎯 Проверка после исправления

### 1. Проверьте структуру БД
```sql
-- Проверка колонок в categories
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- Должны быть: id, name, slug, description, image, parent_id, 
-- materialized_path, position, is_featured, locale, created_at, updated_at
```

### 2. Проверьте пользователя
```sql
-- Проверка администратора
SELECT id, email, name, role, status, email_verified
FROM users 
WHERE email = 'admin@example.com';

-- Должен быть: role = 'admin', status = 'active'
```

### 3. Проверьте аватарки
```sql
-- Проверка структуры user_profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Должны быть: id, user_id, phone, address, city, country, 
-- postal_code, avatar, first_name, last_name, created_at, updated_at
```

---

## 🐛 Решение конкретных проблем

### Проблема 1: "column parent_id does not exist"
**Решение:** Выполните `fix-database-schema.sql` - добавит колонку `parent_id`

### Проблема 2: Query read timeout
**Причина:** Медленное соединение с удаленной БД Supabase
**Решение:** 
- Кеширование уже реализовано
- Увеличьте таймаут в `.env.local`:
  ```env
  DATABASE_TIMEOUT=15000
  ```

### Проблема 3: JWTSessionError
**Причина:** Пользователь не найден или запрос таймаутит
**Решение:**
1. Выполните `reset-admin-password.sql`
2. Перезапустите dev сервер
3. Очистите cookies в браузере (F12 → Application → Cookies → Clear)

### Проблема 4: Аватарки не загружаются
**Причина:** Отсутствуют колонки `first_name`, `last_name`, `avatar` в `user_profiles`
**Решение:** Выполните `fix-database-schema.sql`

---

## 📝 Дополнительные настройки

### Увеличение производительности

1. **Увеличьте connection pool:**
```typescript
// lib/db.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // было 2, увеличиваем до 5
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

2. **Увеличьте время кеширования:**
```typescript
// app/api/admin/analytics/route.ts
const CACHE_TTL = 10 * 60 * 1000; // было 5 минут, делаем 10
```

3. **Добавьте индексы для часто используемых запросов:**
```sql
-- Индексы уже добавлены в fix-database-schema.sql
-- Но можно добавить дополнительные:
CREATE INDEX IF NOT EXISTS idx_users_email_role ON users(email, role);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
```

---

## ✅ Контрольный список

После выполнения всех шагов проверьте:

- [ ] Выполнен `fix-database-schema.sql`
- [ ] Выполнен `reset-admin-password.sql`
- [ ] Dev сервер перезапущен
- [ ] Cookies очищены в браузере
- [ ] Вход в админ панель работает (`admin@example.com` / `admin123`)
- [ ] Нет ошибок "column does not exist" в логах
- [ ] Страницы загружаются без таймаутов
- [ ] Аватарки отображаются корректно

---

## 🚀 Следующие шаги

После исправления всех проблем:

1. **Добавьте тестовые данные:**
   - Создайте несколько категорий
   - Добавьте товары с изображениями
   - Загрузите аватарки для пользователей

2. **Оптимизируйте производительность:**
   - Настройте CDN для изображений
   - Включите Redis для кеширования (опционально)
   - Используйте ISR для статических страниц

3. **Подготовьте к деплою:**
   - Проверьте все environment variables
   - Протестируйте на production БД
   - Задеплойте на Vercel

---

## 📞 Если проблемы остались

### Диагностика:

1. **Проверьте логи сервера:**
```bash
npm run dev
# Смотрите на ошибки в консоли
```

2. **Проверьте подключение к БД:**
```bash
# Создайте файл test-db.js
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(r => console.log('✅ DB OK:', r.rows[0])).catch(e => console.error('❌ DB Error:', e));
"
```

3. **Проверьте структуру таблиц:**
```sql
-- Выполните в Supabase SQL Editor
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

---

**Готово!** После выполнения всех шагов приложение должно работать без ошибок. 🎉
