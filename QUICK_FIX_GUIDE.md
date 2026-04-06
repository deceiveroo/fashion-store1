# 🚨 СРОЧНОЕ ИСПРАВЛЕНИЕ - Таблицы не созданы

## Проблема
Ошибка: `relation "user_wishlist_items" does not exist`

Это означает, что таблицы `user_wishlist_items` и `user_profiles` не созданы в базе данных.

## ⚡ БЫСТРОЕ РЕШЕНИЕ (2 минуты)

### Шаг 1: Откройте Supabase SQL Editor
1. Перейдите: https://supabase.com/dashboard
2. Выберите ваш проект
3. Нажмите **SQL Editor** в левом меню
4. Нажмите **New Query**

### Шаг 2: Скопируйте и выполните этот SQL

```sql
-- ============================================
-- СОЗДАНИЕ ТАБЛИЦ ДЛЯ ПРОФИЛЕЙ И ИЗБРАННОГО
-- ============================================

-- 1. Таблица профилей пользователей
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  avatar TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Индекс для быстрого поиска по user_id
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_user_id_idx 
ON user_profiles(user_id);

-- 2. Таблица избранных товаров
CREATE TABLE IF NOT EXISTS user_wishlist_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Уникальный индекс: один товар = один раз в избранном у пользователя
CREATE UNIQUE INDEX IF NOT EXISTS user_wishlist_items_user_product_unique 
ON user_wishlist_items(user_id, product_id);

-- Индекс для быстрого поиска избранного пользователя
CREATE INDEX IF NOT EXISTS user_wishlist_items_user_idx 
ON user_wishlist_items(user_id);

-- Индекс для поиска пользователей, добавивших товар в избранное
CREATE INDEX IF NOT EXISTS user_wishlist_items_product_idx 
ON user_wishlist_items(product_id);
```

### Шаг 3: Нажмите RUN (или Ctrl+Enter)

Вы должны увидеть:
```
Success. No rows returned
```

### Шаг 4: Перезапустите приложение

```bash
# В терминале нажмите Ctrl+C
# Затем запустите снова:
npm run dev
```

## ✅ Проверка

После выполнения миграции:

1. **Откройте сайт**: http://localhost:3000
2. **Войдите в систему**
3. **Проверьте профиль**: http://localhost:3000/profile
   - Должна открыться страница профиля
   - Можно редактировать имя, фамилию, телефон
4. **Проверьте избранное**: 
   - Откройте любой товар
   - Нажмите на иконку сердечка
   - Товар должен добавиться в избранное
   - Откройте http://localhost:3000/favorites
   - Товар должен отображаться

## 🔍 Проверка в Supabase

Убедитесь, что таблицы созданы:

```sql
-- Проверка таблиц
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'user_wishlist_items');
```

Должно вернуть:
```
user_profiles
user_wishlist_items
```

## 🐛 Если ошибки продолжаются

### Ошибка: "Connection terminated unexpectedly"

**Причина:** Слишком много открытых соединений

**Решение:**
1. Подождите 2-3 минуты
2. Перезапустите приложение
3. Проверьте, что используете правильный DATABASE_URL:

```env
# ✅ ПРАВИЛЬНО - используйте pooler
DATABASE_URL=postgresql://postgres.[project]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# ❌ НЕПРАВИЛЬНО - прямое подключение (медленно)
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

### Ошибка: "Query read timeout"

**Причина:** Запрос выполняется слишком долго

**Решение:**
1. Проверьте, что индексы созданы (см. SQL выше)
2. Подождите несколько минут
3. Попробуйте снова

### Ошибка: "relation does not exist" после миграции

**Причина:** Миграция не выполнилась или выполнилась в другой схеме

**Решение:**
1. Проверьте, что вы в правильной схеме (public)
2. Выполните проверочный запрос:
   ```sql
   SELECT * FROM user_wishlist_items LIMIT 1;
   ```
3. Если ошибка - таблица не создана, повторите миграцию

## 📊 Мониторинг

Добавьте в консоль для отладки:

```typescript
// В любом API route
console.log('DB Pool status:', {
  total: pool.totalCount,
  idle: pool.idleCount,
  waiting: pool.waitingCount
});
```

Это покажет состояние пула соединений.

## 🎯 Итог

После выполнения миграции:
- ✅ Профиль работает
- ✅ Избранное работает
- ✅ Нет ошибок "relation does not exist"
- ✅ Нет ошибок "Connection terminated"

Если проблемы остаются - напишите в чат с полным текстом ошибки из консоли.
