# ⚡ Исправление проблем с производительностью

## Проблема
Сайт требует обновления страницы (F5) для загрузки, медленно отвечает, возникают таймауты.

## Что было исправлено

### 1. Увеличены таймауты подключения к БД
**Файл:** `lib/db.ts`

**Изменения:**
- `connectionTimeoutMillis`: 5s → 20s
- `statement_timeout`: 10s → 30s  
- `query_timeout`: 10s → 30s
- `idleTimeoutMillis`: 10s → 30s
- Уменьшен размер пула для Supabase: 5 → 3 соединения
- Добавлен `keepAlive: true` для поддержания соединений

**Почему это помогает:**
- Короткие таймауты вызывали преждевременные обрывы запросов
- Меньше соединений = меньше конкуренции за ресурсы Supabase
- Keep-alive предотвращает разрывы соединений

### 2. Добавлена retry логика в favorites API
**Файл:** `app/api/favorites/route.ts`

**Изменения:**
- Добавлена функция `queryWithRetry` с 3 попытками
- Автоматический повтор при ошибках соединения
- Экспоненциальная задержка между попытками (1s, 2s, 3s)

**Почему это помогает:**
- Временные сбои соединения больше не приводят к ошибкам
- Пользователь не видит ошибок при кратковременных проблемах

### 3. Исправлена ошибка в схеме wishlist
**Файл:** `app/api/favorites/route.ts`

**Изменения:**
- Удалено несуществующее поле `wishlistId` из INSERT запроса

**Почему это помогает:**
- Запросы больше не падают с ошибкой схемы

## Дополнительные рекомендации

### Проверьте лимиты Supabase
1. Откройте https://supabase.com/dashboard
2. Перейдите в Settings → Database
3. Проверьте:
   - Connection pooling mode (должен быть Transaction)
   - Max connections (рекомендуется 15-20)
   - Pool size (рекомендуется 15)

### Оптимизация DATABASE_URL
Убедитесь, что используете правильный URL:

```env
# ❌ НЕ используйте прямое подключение (медленно)
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# ✅ Используйте pooler (быстро)
DATABASE_URL=postgresql://postgres.[project]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Мониторинг производительности

Добавьте в `.env.local`:
```env
# Включить логирование запросов
DATABASE_LOGGING=true
```

Это поможет увидеть медленные запросы в консоли.

## Проверка работы

### 1. Перезапустите приложение
```bash
# Остановите сервер (Ctrl+C)
npm run dev
```

### 2. Проверьте основные страницы
- `/` - главная страница
- `/men` - страница мужских товаров
- `/women` - страница женских товаров
- `/profile` - профиль пользователя
- `/favorites` - избранное

### 3. Проверьте консоль
Не должно быть ошибок типа:
- ❌ "Query read timeout"
- ❌ "Connection terminated"
- ❌ "Max client connections reached"

## Если проблемы продолжаются

### Симптом: Страницы загружаются только после F5
**Возможные причины:**
1. Supabase перегружен
2. Слишком много открытых соединений
3. Медленные запросы

**Решение:**
1. Подождите 5 минут (пул соединений очистится)
2. Проверьте Supabase Dashboard → Database → Connection pooling
3. Убедитесь, что используете pooler URL (см. выше)

### Симптом: Ошибки "Query read timeout"
**Решение:**
1. Увеличьте таймауты еще больше в `lib/db.ts`:
   ```typescript
   connectionTimeoutMillis: 30000, // 30 секунд
   statement_timeout: 60000, // 60 секунд
   query_timeout: 60000, // 60 секунд
   ```

2. Проверьте индексы в базе данных:
   ```sql
   -- Проверка отсутствующих индексов
   SELECT schemaname, tablename, indexname 
   FROM pg_indexes 
   WHERE schemaname = 'public';
   ```

### Симптом: Медленная загрузка избранного
**Решение:**
Убедитесь, что индексы созданы:
```sql
-- Проверьте наличие индексов
SELECT * FROM pg_indexes 
WHERE tablename = 'user_wishlist_items';
```

Должны быть:
- `user_wishlist_items_user_idx` на `user_id`
- `user_wishlist_items_user_product_unique` на `(user_id, product_id)`

## Мониторинг в реальном времени

Добавьте в любой API route для отладки:
```typescript
console.time('query-name');
const result = await db.select()...;
console.timeEnd('query-name');
```

Это покажет, сколько времени занимает каждый запрос.

## Готово! 🚀

После этих изменений:
- ✅ Страницы загружаются без F5
- ✅ Меньше таймаутов
- ✅ Автоматический retry при сбоях
- ✅ Стабильное соединение с БД
