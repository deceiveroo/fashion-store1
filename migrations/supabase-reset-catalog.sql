-- ELEVATE Fashion Store — сброс тестового каталога и загрузка реальных товаров
-- Выполните в Supabase: SQL Editor → New query → Run
-- ВНИМАНИЕ: удаляет ВСЕ существующие товары и связи!

BEGIN;

-- 1. Очистка связанных данных
DELETE FROM product_category;
DELETE FROM product_images;
DELETE FROM cart_items WHERE product_id IS NOT NULL;
DELETE FROM user_wishlist_items WHERE product_id IS NOT NULL;
DELETE FROM collection_items WHERE product_id IS NOT NULL;
DELETE FROM bundle_items WHERE product_id IS NOT NULL;
DELETE FROM product_recommendations;
DELETE FROM products;

-- 2. Категории (фиксированные id для привязки в коде)
INSERT INTO categories (id, name, slug, description, is_active, sort_order, locale)
VALUES
  ('women', 'Женское', 'zhenskoe', 'Женская коллекция ELEVATE', true, 1, 'ru'),
  ('men', 'Мужское', 'muzhskoe', 'Мужская коллекция ELEVATE', true, 2, 'ru'),
  ('new', 'Новинки', 'novinki', 'Новые поступления', true, 3, 'ru'),
  ('collections', 'Коллекции', 'kollektsii', 'Избранные подборки', true, 4, 'ru')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  is_active = true,
  updated_at = NOW();

-- 3. Товары
INSERT INTO products (
  id, name, slug, sku, description, price, stock, category_id,
  in_stock, featured, is_featured, is_new, is_active, is_sale, created_at, updated_at
) VALUES
  ('elevate-w-001', 'Платье миди Aurora', 'dress-midi-aurora', 'ELV-W-001',
   'Элегантное платье миди из смесового хлопка. Идеально для офиса и вечера.', 5990, 24, 'women',
   true, true, true, true, true, false, NOW() - INTERVAL '3 days', NOW()),
  ('elevate-w-002', 'Джинсы High Rise', 'jeans-high-rise', 'ELV-W-002',
   'Джинсы с высокой посадкой и эластичным денимом.', 4490, 35, 'women',
   true, false, false, false, true, false, NOW(), NOW()),
  ('elevate-w-003', 'Блузка шёлк Touch', 'blouse-silk-touch', 'ELV-W-003',
   'Лёгкая блузка с мягким блеском и свободным кроем.', 6990, 18, 'women',
   true, true, true, false, true, true, NOW(), NOW()),
  ('elevate-w-004', 'Пальто Wool Line', 'coat-wool-line', 'ELV-W-004',
   'Тёплое шерстяное пальто оверсайз на подкладке.', 14990, 12, 'women',
   true, true, true, true, true, false, NOW() - INTERVAL '1 day', NOW()),
  ('elevate-m-001', 'Футболка Essential Cotton', 'tee-essential-cotton', 'ELV-M-001',
   'Базовая футболка из органического хлопка.', 1990, 50, 'men',
   true, false, false, false, true, false, NOW(), NOW()),
  ('elevate-m-002', 'Джинсы Slim Fit', 'jeans-slim-fit', 'ELV-M-002',
   'Классические джинсы slim fit с комфортным stretch.', 4990, 30, 'men',
   true, true, true, false, true, false, NOW(), NOW()),
  ('elevate-m-003', 'Куртка Urban Shell', 'jacket-urban-shell', 'ELV-M-003',
   'Лёгкая ветровка с водоотталкивающей пропиткой.', 8990, 20, 'men',
   true, true, true, true, true, false, NOW() - INTERVAL '2 days', NOW()),
  ('elevate-m-004', 'Худи Oversize Core', 'hoodie-oversize-core', 'ELV-M-004',
   'Уютное худи свободного кроя с начёсом.', 3990, 28, 'men',
   true, false, false, true, true, true, NOW() - INTERVAL '1 day', NOW()),
  ('elevate-n-001', 'Костюм Soft Tailoring', 'suit-soft-tailoring', 'ELV-N-001',
   'Минималистичный костюм из мягкой ткани — новинка сезона.', 12990, 10, 'new',
   true, true, true, true, true, false, NOW(), NOW()),
  ('elevate-c-001', 'Сумка Crossbody Line', 'bag-crossbody-line', 'ELV-C-001',
   'Кожаная сумка через плечо — хит коллекции.', 5990, 22, 'collections',
   true, true, true, false, true, false, NOW(), NOW());

-- 4. Изображения (picsum — стабильные URL)
INSERT INTO product_images (id, product_id, url, is_primary, sort_order) VALUES
  ('img-w-001', 'elevate-w-001', 'https://picsum.photos/seed/elevate-w-001/800/1000', true, 0),
  ('img-w-002', 'elevate-w-002', 'https://picsum.photos/seed/elevate-w-002/800/1000', true, 0),
  ('img-w-003', 'elevate-w-003', 'https://picsum.photos/seed/elevate-w-003/800/1000', true, 0),
  ('img-w-004', 'elevate-w-004', 'https://picsum.photos/seed/elevate-w-004/800/1000', true, 0),
  ('img-m-001', 'elevate-m-001', 'https://picsum.photos/seed/elevate-m-001/800/1000', true, 0),
  ('img-m-002', 'elevate-m-002', 'https://picsum.photos/seed/elevate-m-002/800/1000', true, 0),
  ('img-m-003', 'elevate-m-003', 'https://picsum.photos/seed/elevate-m-003/800/1000', true, 0),
  ('img-m-004', 'elevate-m-004', 'https://picsum.photos/seed/elevate-m-004/800/1000', true, 0),
  ('img-n-001', 'elevate-n-001', 'https://picsum.photos/seed/elevate-n-001/800/1000', true, 0),
  ('img-c-001', 'elevate-c-001', 'https://picsum.photos/seed/elevate-c-001/800/1000', true, 0);

-- 5. Связи товар ↔ категория (для витрины /women, /men, /new, /collections)
INSERT INTO product_category (id, product_id, category_id) VALUES
  ('pc-w-001', 'elevate-w-001', 'women'),
  ('pc-w-002', 'elevate-w-002', 'women'),
  ('pc-w-003', 'elevate-w-003', 'women'),
  ('pc-w-004', 'elevate-w-004', 'women'),
  ('pc-m-001', 'elevate-m-001', 'men'),
  ('pc-m-002', 'elevate-m-002', 'men'),
  ('pc-m-003', 'elevate-m-003', 'men'),
  ('pc-m-004', 'elevate-m-004', 'men'),
  ('pc-n-001', 'elevate-n-001', 'new'),
  ('pc-n-001-w', 'elevate-n-001', 'women'),
  ('pc-c-001', 'elevate-c-001', 'collections'),
  ('pc-w-001-f', 'elevate-w-001', 'collections'),
  ('pc-m-003-f', 'elevate-m-003', 'collections');

-- Новинки: первые 3 женских + 2 мужских
INSERT INTO product_category (id, product_id, category_id) VALUES
  ('pc-w-001-n', 'elevate-w-001', 'new'),
  ('pc-w-003-n', 'elevate-w-003', 'new'),
  ('pc-w-004-n', 'elevate-w-004', 'new'),
  ('pc-m-003-n', 'elevate-m-003', 'new'),
  ('pc-m-004-n', 'elevate-m-004', 'new')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Проверка
SELECT COUNT(*) AS products FROM products;
SELECT COUNT(*) AS images FROM product_images;
SELECT COUNT(*) AS links FROM product_category;
