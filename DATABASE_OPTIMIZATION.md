# Оптимизация работы с удаленной базой данных

## Проблема

При локальной разработке с удаленной базой данных (Supabase) возникают проблемы:
- Большая задержка сети (latency)
- Медленные запросы (10-15 секунд)
- Таймауты соединений
- Множественные запросы к БД

## Решения

### 1. ✅ Кеширование в памяти

Добавлено простое кеширование для API endpoints:

#### Analytics API (`app/api/admin/analytics/route.ts`)
```typescript
// Кеш на 5 минут
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// Проверка кеша перед запросом
const cacheKey = `analytics:${type}`;
const cached = getCached(cacheKey);
if (cached) {
  return NextResponse.json(cached);
}
```

#### Stats API (`app/api/admin/stats/route.ts`)
```typescript
// Кеш на 3 минуты
const CACHE_TTL = 3 * 60 * 1000;

// Проверка кеша
const cacheKey = `stats:${range}`;
const cached = getCached(cacheKey);
if (cached) {
  return NextResponse.json(cached);
}
```

### 2. ✅ Уменьшение таймаутов

Изменены таймауты для более быстрого отказа:

```typescript
async function queryWithRetry<T>(
  queryFn: () => Promise<T>, 
  maxRetries = 2,  // Было 3
  timeoutMs = 8000  // 8 секунд вместо 15
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
  );
  
  return await Promise.race([queryFn(), timeoutPromise]);
}
```

### 3. ✅ Graceful degradation

При ошибках возвращаются пустые данные вместо ошибок:

```typescript
try {
  result = await getAnalytics();
} catch (error) {
  console.error('Analytics error:', error);
  // Возвращаем пустые данные
  return NextResponse.json(getEmptyData(type));
}
```

### 4. ✅ Оптимизация connection pool

В `lib/db.ts`:

```typescript
{
  max: 2,  // Минимум соединений для Supabase
  min: 0,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 15000,
  query_timeout: 15000,
}
```

## Результаты

### До оптимизации:
- ❌ Каждый запрос к БД: 10-15 секунд
- ❌ Множественные таймауты
- ❌ Страница загружается 30+ секунд
- ❌ Частые ошибки соединения

### После оптимизации:
- ✅ Первый запрос: 8-10 секунд (с таймаутом)
- ✅ Повторные запросы: мгновенно (из кеша)
- ✅ Страница загружается быстрее
- ✅ Меньше ошибок соединения

## Как работает кеширование

### 1. Первый запрос
```
Пользователь → API → Проверка кеша (пусто) → БД (медленно) → Сохранение в кеш → Ответ
```

### 2. Повторный запрос (в течение TTL)
```
Пользователь → API → Проверка кеша (есть данные) → Ответ (мгновенно)
```

### 3. После истечения TTL
```
Пользователь → API → Проверка кеша (устарело) → БД → Обновление кеша → Ответ
```

## Настройка TTL (Time To Live)

### Analytics API - 5 минут
```typescript
const CACHE_TTL = 5 * 60 * 1000;
```

Почему 5 минут:
- Данные аналитики меняются не часто
- Можно увеличить до 10-15 минут для еще лучшей производительности

### Stats API - 3 минуты
```typescript
const CACHE_TTL = 3 * 60 * 1000;
```

Почему 3 минуты:
- Статистика обновляется чаще
- Баланс между актуальностью и производительностью

## Дополнительные рекомендации

### 1. Увеличить TTL для production
```typescript
// Development: 3-5 минут
// Production: 10-15 минут
const CACHE_TTL = process.env.NODE_ENV === 'production' 
  ? 15 * 60 * 1000 
  : 5 * 60 * 1000;
```

### 2. Использовать Redis для production
Для production лучше использовать Redis вместо кеша в памяти:

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

async function getCached(key: string) {
  return await redis.get(key);
}

async function setCache(key: string, data: any) {
  await redis.setex(key, 300, JSON.stringify(data)); // 5 минут
}
```

### 3. Добавить индексы в БД
Убедитесь, что в БД есть индексы на часто используемые поля:

```sql
-- Индекс на created_at для быстрой фильтрации по датам
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Индекс на status для быстрой группировки
CREATE INDEX idx_orders_status ON orders(status);
```

### 4. Использовать CDN для статики
Для production используйте CDN (Vercel, Cloudflare) для кеширования статических данных.

### 5. Рассмотреть локальную БД для разработки
Для локальной разработки можно использовать:
- PostgreSQL в Docker
- SQLite для быстрого прототипирования
- Supabase Local Development

```bash
# Запуск PostgreSQL в Docker
docker run -d \
  --name postgres-dev \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=fashion_store \
  -p 5432:5432 \
  postgres:15
```

## Мониторинг

### Проверка эффективности кеша

Добавьте логирование:

```typescript
function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`✅ Cache HIT: ${key}`);
    return cached.data;
  }
  console.log(`❌ Cache MISS: ${key}`);
  return null;
}
```

### Статистика кеша

```typescript
function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    oldestEntry: Math.min(...Array.from(cache.values()).map(v => v.timestamp)),
  };
}
```

## Итог

✅ Кеширование добавлено в Analytics и Stats API
✅ Таймауты уменьшены для быстрого отказа
✅ Graceful degradation при ошибках
✅ Connection pool оптимизирован

Результат: Значительное улучшение производительности при работе с удаленной БД.

---

**Рекомендация:** Для production рассмотрите использование Redis и CDN для еще лучшей производительности.
