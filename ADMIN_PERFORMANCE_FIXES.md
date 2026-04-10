# План оптимизации админки

## Приоритет 1: Критические исправления (сделать сейчас)

### 1. Исправить N+1 запросы в Orders API
**Файл**: `app/api/admin/orders/route.ts`

```typescript
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['admin', 'manager', 'support'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Один запрос вместо N+1
    const ordersWithItems = await db
      .select({
        orderId: orders.id,
        orderUserId: orders.userId,
        orderTotal: orders.total,
        orderStatus: orders.status,
        orderCreatedAt: orders.createdAt,
        orderComment: orders.comment,
        orderDeliveryMethod: orders.deliveryMethod,
        orderPaymentMethod: orders.paymentMethod,
        itemId: orderItems.id,
        itemName: orderItems.name,
        itemQuantity: orderItems.quantity,
        itemPrice: orderItems.price,
        itemImage: orderItems.image,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .orderBy(desc(orders.createdAt));

    // Группируем items по заказам
    const grouped = ordersWithItems.reduce((acc, row) => {
      const orderId = row.orderId;
      if (!acc[orderId]) {
        acc[orderId] = {
          id: row.orderId,
          userId: row.orderUserId,
          total: row.orderTotal,
          status: row.orderStatus,
          createdAt: row.orderCreatedAt,
          comment: row.orderComment,
          deliveryMethod: row.orderDeliveryMethod,
          paymentMethod: row.orderPaymentMethod,
          items: [],
        };
      }
      if (row.itemId) {
        acc[orderId].items.push({
          id: row.itemId,
          name: row.itemName,
          quantity: row.itemQuantity,
          price: row.itemPrice,
          image: row.itemImage,
        });
      }
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(Object.values(grouped));
  } catch (error: any) {
    console.error('[ADMIN ORDERS] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
```

### 2. Увеличить connection pool
**Файл**: `lib/db.ts`

```typescript
export const pool = new Pool({
  ...buildPoolConfig(),
  max: 10, // ✅ Было 1, стало 10
  min: 2,  // ✅ Держим 2 соединения всегда
  idleTimeoutMillis: 30000, // ✅ 30 секунд вместо 10
  connectionTimeoutMillis: 5000,
});
```

### 3. Добавить индексы в БД
**Создать файл**: `add-admin-indexes.sql`

```sql
-- Индексы для orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Индексы для order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Индексы для support_chat_sessions
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_status ON support_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_last_message_at ON support_chat_sessions(last_message_at DESC);

-- Индексы для support_chat_messages
CREATE INDEX IF NOT EXISTS idx_support_chat_messages_session_id ON support_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_messages_created_at ON support_chat_messages(created_at DESC);

-- Composite индекс для аналитики
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at DESC);
```

### 4. Добавить пагинацию в Products
**Файл**: `app/api/products/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  const [productsData, totalCount] = await Promise.all([
    db.select().from(products).limit(limit).offset(offset),
    db.select({ count: count() }).from(products),
  ]);

  return NextResponse.json({
    products: productsData,
    pagination: {
      page,
      limit,
      total: totalCount[0].count,
      pages: Math.ceil(totalCount[0].count / limit),
    },
  });
}
```

### 5. Объединить запросы аналитики
**Файл**: `app/api/admin/analytics/route.ts`

Добавить endpoint `?type=dashboard` который возвращает все данные одним запросом:

```typescript
case 'dashboard':
  const [revenue, orders, products, customers] = await Promise.all([
    getRevenueByMonth(),
    getOrdersByStatus(),
    getTopProducts(),
    getCustomerGrowth(),
  ]);
  result = { revenue, orders, products, customers };
  break;
```

## Приоритет 2: Важные улучшения (сделать на этой неделе)

### 6. Заменить polling на Server-Sent Events
**Создать**: `app/api/admin/support-chats/stream/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = async () => {
        try {
          const sessions = await db
            .select()
            .from(supportChatSessions)
            .where(eq(supportChatSessions.status, 'active'));
          
          const data = `data: ${JSON.stringify(sessions)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          console.error('SSE error:', error);
        }
      };

      // Отправляем обновления каждые 5 секунд
      const interval = setInterval(sendUpdate, 5000);
      await sendUpdate(); // Первое обновление сразу

      // Очистка при закрытии соединения
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 7. Добавить Redis для кеширования
**Файл**: `lib/cache.ts`

```typescript
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, value: T, ttl = 300): Promise<void> {
  if (!redis) return;
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}
```

### 8. Оптимизировать изображения
**Файл**: `components/admin/ProductImage.tsx`

```typescript
import Image from 'next/image';

export function ProductImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={80}
      height={80}
      className="rounded-lg object-cover"
      loading="lazy"
      quality={75}
    />
  );
}
```

### 9. Добавить rate limiting
**Файл**: `middleware.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    
    if (!success) {
      return new Response('Too Many Requests', { status: 429 });
    }
  }
}
```

## Приоритет 3: Дополнительные улучшения

### 10. Добавить мониторинг производительности
- Установить `@vercel/analytics` или `@sentry/nextjs`
- Логировать медленные запросы (>1s)
- Отслеживать ошибки БД

### 11. Оптимизировать bundle size
```bash
npm install @next/bundle-analyzer
```

### 12. Добавить prefetching
```typescript
// В списке заказов
<Link href={`/admin/orders/${order.id}`} prefetch={true}>
```

## Метрики до/после

### До оптимизации:
- Загрузка Orders: ~3-5s (100 заказов)
- Загрузка Dashboard: ~4-6s (5 последовательных запросов)
- Connection pool exhaustion: часто
- Memory leaks: polling без cleanup

### После оптимизации (ожидаемо):
- Загрузка Orders: ~500ms (JOIN вместо N+1)
- Загрузка Dashboard: ~1-2s (параллельные запросы + кеш)
- Connection pool: стабильный
- Memory: SSE вместо polling

## Команды для применения

```bash
# 1. Применить индексы
psql $DATABASE_URL -f add-admin-indexes.sql

# 2. Установить зависимости для кеширования (опционально)
npm install @upstash/redis @upstash/ratelimit

# 3. Перезапустить dev сервер
npm run dev
```
