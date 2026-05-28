-- ============================================================================
-- ELEVATE Fashion Store — ЗАКАЗЫ для seed-пользователей.
--
-- Назначение:
--   • дать заказ КАЖДОМУ пользователю user-001..085;
--   • наполнить заказы товарами, которые человек оставил в отзывах
--     (так «подтверждённая покупка» в отзыве становится настоящей);
--   • пользователям без отзывов положить базовый товар;
--   • связать отзывы с заказами (reviews.order_id);
--   • пересчитать суммы заказов; статусы сделать правдоподобными.
--
-- ВАЖНО: запускать ПОСЛЕ обеих партий каталога (seed-catalog-reviews.sql и
--        seed-catalog-reviews-2.sql) — файл читает таблицы reviews/users/products.
-- Применение: Supabase → SQL Editor → New query → Run. Идемпотентно.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ОСНОВНОЙ ЗАКАЗ каждому пользователю (order-user-XXX).
--    Дата привязана к дате регистрации (заказ всегда ПОСЛЕ создания аккаунта).
--    Зарегистрирован давно → «доставлен»; недавно (< 6 дней) → «в пути».
-- ============================================================================
INSERT INTO orders (
  id, order_number, user_id, status, payment_status,
  subtotal, tax, shipping_cost, discount, total, currency,
  payment_method, delivery_method, recipient, shipping_address,
  tracking_number, tracking_status,
  created_at, updated_at, shipped_at, delivered_at, estimated_delivery
)
SELECT
  'order-' || us.id,
  'ELV-2026-' || substr(us.id, 6),
  us.id,
  CASE WHEN us.created_at <= NOW() - INTERVAL '6 days' THEN 'delivered' ELSE 'shipped' END,
  'paid',
  0, 0, 0, 0, 0, 'RUB',
  'card', 'courier',
  COALESCE(NULLIF(TRIM(COALESCE(up.first_name,'') || ' ' || COALESCE(up.last_name,'')), ''), us.name, 'Покупатель'),
  jsonb_build_object(
    'city',      COALESCE(up.address, 'г. Москва'),
    'phone',     COALESCE(up.phone, ''),
    'recipient', COALESCE(us.name, 'Покупатель')
  ),
  'TRK' || substr(us.id, 6) || '00RU',
  CASE WHEN us.created_at <= NOW() - INTERVAL '6 days' THEN 'delivered' ELSE 'in_transit' END,
  us.created_at + INTERVAL '2 hours',
  NOW(),
  us.created_at + INTERVAL '1 day',
  CASE WHEN us.created_at <= NOW() - INTERVAL '6 days'
       THEN LEAST(us.created_at + INTERVAL '4 days', NOW() - INTERVAL '1 day')
       ELSE NULL END,
  CASE WHEN us.created_at <= NOW() - INTERVAL '6 days'
       THEN (LEAST(us.created_at + INTERVAL '4 days', NOW() - INTERVAL '1 day'))::date
       ELSE (NOW() + INTERVAL '3 days')::date END
FROM users us
LEFT JOIN user_profiles up ON up.user_id = us.id
WHERE us.id LIKE 'user-0%'
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. ПОЗИЦИИ ЗАКАЗА из отзывов: каждый отзыв → товар в заказе этого юзера.
--    Так подтверждённые покупки реально подкреплены составом заказа.
-- ============================================================================
INSERT INTO order_items (
  id, order_id, product_id, product_name, name, quantity, price, total, size, color, image, created_at
)
SELECT
  'oi-' || r.id,
  'order-' || r.user_id,
  r.product_id,
  p.name,
  p.name,
  1,
  p.price,
  p.price,
  CASE WHEN p.category_id = 'men' THEN 'L' ELSE 'M' END,
  p.color,
  (p.images)[1],
  o.created_at
FROM reviews r
JOIN products p ON p.id = r.product_id
JOIN orders   o ON o.id = 'order-' || r.user_id
WHERE r.id LIKE 'rev-%'
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. ЗАПАСНОЙ ТОВАР для пользователей без отзывов (пустых заказов не остаётся).
-- ============================================================================
INSERT INTO order_items (
  id, order_id, product_id, product_name, name, quantity, price, total, size, color, image, created_at
)
SELECT
  'oi-fb-' || o.user_id,
  o.id,
  p.id, p.name, p.name, 1, p.price, p.price,
  'M', p.color, (p.images)[1], o.created_at
FROM orders o
JOIN products p ON p.id = 'elevate-m-101'
WHERE o.id LIKE 'order-user-%'
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. ВТОРОЙ ЗАКАЗ (более ранний) части давних пользователей — для разнообразия.
--    Берём тех, кто зарегистрирован > 40 дней назад и с чётным номером.
-- ============================================================================
INSERT INTO orders (
  id, order_number, user_id, status, payment_status,
  subtotal, tax, shipping_cost, discount, total, currency,
  payment_method, delivery_method, recipient, shipping_address,
  tracking_number, tracking_status,
  created_at, updated_at, shipped_at, delivered_at, estimated_delivery
)
SELECT
  'order2-' || us.id,
  'ELV-2026-9' || substr(us.id, 6),
  us.id,
  'delivered',
  'paid',
  0, 0, 0, 0, 0, 'RUB',
  'card', 'courier',
  COALESCE(NULLIF(TRIM(COALESCE(up.first_name,'') || ' ' || COALESCE(up.last_name,'')), ''), us.name, 'Покупатель'),
  jsonb_build_object(
    'city',      COALESCE(up.address, 'г. Москва'),
    'phone',     COALESCE(up.phone, ''),
    'recipient', COALESCE(us.name, 'Покупатель')
  ),
  'TRK' || substr(us.id, 6) || '99RU',
  'delivered',
  us.created_at + INTERVAL '10 days',
  NOW(),
  us.created_at + INTERVAL '11 days',
  us.created_at + INTERVAL '13 days',
  (us.created_at + INTERVAL '13 days')::date
FROM users us
LEFT JOIN user_profiles up ON up.user_id = us.id
WHERE us.id LIKE 'user-0%'
  AND us.created_at <= NOW() - INTERVAL '40 days'
  AND (substr(us.id, 6)::int % 2) = 0
ON CONFLICT (id) DO NOTHING;

-- Позиции второго заказа: базовый featured-товар (худи)
INSERT INTO order_items (
  id, order_id, product_id, product_name, name, quantity, price, total, size, color, image, created_at
)
SELECT
  'oi2-' || o.user_id,
  o.id,
  p.id, p.name, p.name, 1, p.price, p.price,
  'L', p.color, (p.images)[1], o.created_at
FROM orders o
JOIN products p ON p.id = 'elevate-m-104'
WHERE o.id LIKE 'order2-user-%'
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. ПЕРЕСЧЁТ СУММ заказов (только наши seed-заказы). Доставка бесплатна от 5000 ₽.
-- ============================================================================
UPDATE orders o SET
  subtotal      = s.sub,
  shipping_cost = CASE WHEN s.sub >= 5000 THEN 0 ELSE 390 END,
  total         = s.sub + CASE WHEN s.sub >= 5000 THEN 0 ELSE 390 END,
  updated_at    = NOW()
FROM (
  SELECT order_id, SUM(total) AS sub
  FROM order_items
  GROUP BY order_id
) s
WHERE o.id = s.order_id
  AND (o.id LIKE 'order-user-%' OR o.id LIKE 'order2-user-%');

-- ============================================================================
-- 6. СВЯЗЬ ОТЗЫВ → ЗАКАЗ (подтверждённые покупки ссылаются на реальный заказ).
-- ============================================================================
UPDATE reviews r SET order_id = 'order-' || r.user_id
FROM orders o
WHERE o.id = 'order-' || r.user_id
  AND r.id LIKE 'rev-%'
  AND r.is_verified_purchase = TRUE
  AND r.order_id IS NULL;

COMMIT;

-- ============================================================================
-- ПРОВЕРКА
-- ============================================================================
SELECT COUNT(*) AS seed_orders        FROM orders      WHERE id LIKE 'order-user-%' OR id LIKE 'order2-user-%';
SELECT COUNT(DISTINCT user_id) AS users_with_orders FROM orders WHERE id LIKE 'order%-user-%';
SELECT COUNT(*) AS order_items        FROM order_items WHERE id LIKE 'oi-%' OR id LIKE 'oi2-%';
SELECT status, COUNT(*) FROM orders WHERE id LIKE 'order%-user-%' GROUP BY status;
SELECT COUNT(*) AS linked_reviews     FROM reviews WHERE order_id LIKE 'order-user-%';
-- Пример: заказы одного пользователя с составом
SELECT o.order_number, o.status, o.total, oi.product_name, oi.price
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.user_id = 'user-001'
ORDER BY o.created_at;
