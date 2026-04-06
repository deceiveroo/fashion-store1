# 🔧 Исправление отсутствующих таблиц в базе данных

## Проблема
Приложение пытается использовать таблицы `user_profiles` и `user_wishlist_items`, которые не существуют в базе данных.

## Решение

### Шаг 1: Откройте Supabase SQL Editor
1. Перейдите на https://supabase.com/dashboard
2. Выберите ваш проект
3. Откройте SQL Editor (слева в меню)

### Шаг 2: Выполните миграцию
Скопируйте и выполните следующий SQL код:

```sql
-- Создание таблицы user_profiles (если не существует)
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

-- Создание индекса для user_profiles
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);

-- Создание таблицы user_wishlist_items (если не существует)
CREATE TABLE IF NOT EXISTS user_wishlist_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Создание индексов для user_wishlist_items
CREATE UNIQUE INDEX IF NOT EXISTS user_wishlist_items_user_product_unique ON user_wishlist_items(user_id, product_id);
CREATE INDEX IF NOT EXISTS user_wishlist_items_user_idx ON user_wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS user_wishlist_items_product_idx ON user_wishlist_items(product_id);
```

### Шаг 3: Проверьте результат
После выполнения SQL команды вы должны увидеть сообщение об успешном выполнении.

### Шаг 4: Перезапустите приложение
```bash
# Остановите сервер (Ctrl+C)
npm run dev
```

## Что было исправлено в коде

1. ✅ Добавлена таблица `userProfiles` в `lib/schema.ts`
2. ✅ Добавлена таблица `userWishlistItems` в `lib/schema.ts` (уже была)
3. ✅ Восстановлен рабочий код в `app/api/profile/route.ts`

## Проверка работы

### Профиль пользователя
1. Войдите в систему
2. Перейдите на страницу `/profile`
3. Попробуйте обновить имя, фамилию, телефон
4. Изменения должны сохраниться без ошибок

### Избранное (Wishlist)
1. Откройте любую страницу с товарами
2. Нажмите на иконку сердечка на товаре
3. Товар должен добавиться в избранное
4. Перейдите на `/favorites` - товар должен отображаться

## Если ошибки продолжаются

### Query read timeout
Если вы видите ошибку "Query read timeout", это означает:
- База данных перегружена
- Слишком много открытых соединений
- Нужно подождать несколько минут

**Решение:**
1. Подождите 2-3 минуты
2. Перезапустите приложение
3. Проверьте количество активных соединений в Supabase Dashboard

### Таблица не найдена
Если после миграции все еще ошибка "table not found":
1. Убедитесь, что SQL выполнился без ошибок
2. Проверьте, что таблицы созданы в правильной схеме (public)
3. Перезапустите приложение

## Структура таблиц

### user_profiles
Хранит дополнительную информацию о пользователе:
- `id` - уникальный идентификатор профиля
- `user_id` - ссылка на пользователя (users.id)
- `first_name` - имя
- `last_name` - фамилия
- `phone` - телефон
- `address` - адрес
- `avatar` - URL аватара

### user_wishlist_items
Хранит избранные товары пользователя:
- `id` - уникальный идентификатор записи
- `user_id` - ссылка на пользователя (users.id)
- `product_id` - ссылка на товар (products.id)
- `created_at` - дата добавления в избранное

## Готово! 🎉

После выполнения миграции:
- ✅ Профиль пользователя будет работать
- ✅ Избранное (wishlist) будет работать
- ✅ Ошибки "table not found" исчезнут
