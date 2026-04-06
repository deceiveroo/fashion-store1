-- ============================================
-- SEED: Категории и товары для магазина ELEVATE
-- ============================================

DO $$
DECLARE
  id_men     uuid;
  id_women   uuid;
  id_new     uuid;
  id_sale    uuid;
  id_men_tsh uuid;
  id_men_sh  uuid;
  id_men_pan uuid;
  id_men_jac uuid;
  id_w_dress uuid;
  id_w_tops  uuid;
  id_w_pan   uuid;
  id_w_jac   uuid;
  p1  uuid; p2  uuid; p3  uuid; p4  uuid; p5  uuid;
  p6  uuid; p7  uuid; p8  uuid; p9  uuid; p10 uuid;
  p11 uuid; p12 uuid; p13 uuid; p14 uuid; p15 uuid;
  p16 uuid; p17 uuid; p18 uuid; p19 uuid; p20 uuid;
  p21 uuid; p22 uuid; p23 uuid; p24 uuid; p25 uuid;
  p26 uuid; p27 uuid; p28 uuid; p29 uuid; p30 uuid;
BEGIN

-- ============================================
-- 1. КОРНЕВЫЕ КАТЕГОРИИ (сначала отдельно)
-- ============================================
INSERT INTO categories (id, name, slug, parent_id, position, is_featured, locale, created_at, updated_at)
VALUES (gen_random_uuid(), 'Мужчинам', 'men',   NULL, 1, true,  'ru', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (id, name, slug, parent_id, position, is_featured, locale, created_at, updated_at)
VALUES (gen_random_uuid(), 'Женщинам', 'women', NULL, 2, true,  'ru', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (id, name, slug, parent_id, position, is_featured, locale, created_at, updated_at)
VALUES (gen_random_uuid(), 'Новинки',  'new',   NULL, 3, true,  'ru', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (id, name, slug, parent_id, position, is_featured, locale, created_at, updated_at)
VALUES (gen_random_uuid(), 'Скидки',   'sale',  NULL, 4, false, 'ru', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Читаем реальные ID из таблицы
SELECT id INTO id_men   FROM categories WHERE slug = 'men';
SELECT id INTO id_women FROM categories WHERE slug = 'women';
SELECT id INTO id_new   FROM categories WHERE slug = 'new';
SELECT id INTO id_sale  FROM categories WHERE slug = 'sale';

-- ============================================
-- 2. ПОДКАТЕГОРИИ
-- ============================================
INSERT INTO categories (id, name, slug, parent_id, position, is_featured, locale, created_at, updated_at)
VALUES (gen_random_uuid(), 'Футболки', 'men-tshirts',   id_men,   1, false, 'ru', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (id, name, slug, parent_id, position, is_featured, locale, created_at, updated_at)
VALUES (gen_random_uuid(), 'Рубашки',  'men-shirts',    id_men,   2, false, 'ru', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (id, name, slug, parent_id, position, is_featured, locale, created_at, updated_at)
VALUES (gen_random_uuid(), 'Брюки',    'men-pants',     id_men,   3, false, 'ru', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (id, name, slug, parent_id, position, is_featured, locale, created_at, updated_at)
VALUES (gen_random_uuid(), 'Куртки',   'men-jackets',   id_men,   4, false, 'ru', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (id, name, slug, parent_id, position, is_featured, locale, created_at, updated_at)
VALUES (gen_random_uuid(), 'Платья',   'women-dresses', id_women, 1, false, 'ru', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (id, name, slug, parent_id, position, is_featured, locale, created_at, updated_at)
VALUES (gen_random_uuid(), 'Топы',     'women-tops',    id_women, 2, false, 'ru', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (id, name, slug, parent_id, position, is_featured, locale, created_at, updated_at)
VALUES (gen_random_uuid(), 'Брюки',    'women-pants',   id_women, 3, false, 'ru', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (id, name, slug, parent_id, position, is_featured, locale, created_at, updated_at)
VALUES (gen_random_uuid(), 'Куртки',   'women-jackets', id_women, 4, false, 'ru', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Читаем ID подкатегорий
SELECT id INTO id_men_tsh FROM categories WHERE slug = 'men-tshirts';
SELECT id INTO id_men_sh  FROM categories WHERE slug = 'men-shirts';
SELECT id INTO id_men_pan FROM categories WHERE slug = 'men-pants';
SELECT id INTO id_men_jac FROM categories WHERE slug = 'men-jackets';
SELECT id INTO id_w_dress FROM categories WHERE slug = 'women-dresses';
SELECT id INTO id_w_tops  FROM categories WHERE slug = 'women-tops';
SELECT id INTO id_w_pan   FROM categories WHERE slug = 'women-pants';
SELECT id INTO id_w_jac   FROM categories WHERE slug = 'women-jackets';

-- Генерируем UUID для товаров
p1  := gen_random_uuid(); p2  := gen_random_uuid(); p3  := gen_random_uuid();
p4  := gen_random_uuid(); p5  := gen_random_uuid(); p6  := gen_random_uuid();
p7  := gen_random_uuid(); p8  := gen_random_uuid(); p9  := gen_random_uuid();
p10 := gen_random_uuid(); p11 := gen_random_uuid(); p12 := gen_random_uuid();
p13 := gen_random_uuid(); p14 := gen_random_uuid(); p15 := gen_random_uuid();
p16 := gen_random_uuid(); p17 := gen_random_uuid(); p18 := gen_random_uuid();
p19 := gen_random_uuid(); p20 := gen_random_uuid(); p21 := gen_random_uuid();
p22 := gen_random_uuid(); p23 := gen_random_uuid(); p24 := gen_random_uuid();
p25 := gen_random_uuid(); p26 := gen_random_uuid(); p27 := gen_random_uuid();
p28 := gen_random_uuid(); p29 := gen_random_uuid(); p30 := gen_random_uuid();

-- ============================================
-- 3. ТОВАРЫ
-- ============================================
INSERT INTO products (id, name, description, short_description, slug, sku, price, compare_at_price, stock, category_id, in_stock, featured, created_at, updated_at) VALUES
  (p1,  'Футболка Classic White',  'Классическая белая футболка из 100% хлопка.',          'Классическая белая футболка',     'futbolka-classic-white',   'SKU-M-001', 1990, 2490,  50, id_men_tsh, true, true,  NOW(), NOW()),
  (p2,  'Футболка Oversize Black', 'Оверсайз футболка черного цвета. Свободный крой.',      'Оверсайз футболка черного цвета', 'futbolka-oversize-black',  'SKU-M-002', 2290, NULL,  35, id_men_tsh, true, false, NOW(), NOW()),
  (p3,  'Футболка Graphic Print',  'Футболка с авторским графическим принтом.',             'Футболка с графическим принтом',  'futbolka-graphic-print',   'SKU-M-003', 2790, 3290,  20, id_men_tsh, true, true,  NOW(), NOW()),
  (p4,  'Рубашка Oxford Blue',     'Классическая рубашка Oxford из хлопка.',                'Классическая рубашка Oxford',     'rubashka-oxford-blue',     'SKU-M-004', 4990, 5990,  25, id_men_sh,  true, true,  NOW(), NOW()),
  (p5,  'Рубашка Linen White',     'Льняная рубашка белого цвета. Дышащая ткань.',          'Льняная рубашка белого цвета',    'rubashka-linen-white',     'SKU-M-005', 5490, NULL,  18, id_men_sh,  true, false, NOW(), NOW()),
  (p6,  'Рубашка Flannel Check',   'Фланелевая рубашка в клетку.',                          'Фланелевая рубашка в клетку',     'rubashka-flannel-check',   'SKU-M-006', 4490, 5490,  30, id_men_sh,  true, false, NOW(), NOW()),
  (p7,  'Брюки Slim Chino Beige',  'Зауженные чинос бежевого цвета.',                       'Зауженные чинос бежевого цвета',  'bryuki-slim-chino-beige',  'SKU-M-007', 5990, 7490,  22, id_men_pan, true, true,  NOW(), NOW()),
  (p8,  'Джинсы Straight Dark',    'Прямые джинсы темно-синего цвета.',                     'Прямые джинсы темно-синего цвета','dzhinsy-straight-dark',    'SKU-M-008', 6990, NULL,  40, id_men_pan, true, false, NOW(), NOW()),
  (p9,  'Брюки Cargo Black',       'Карго брюки черного цвета с накладными карманами.',     'Карго брюки черного цвета',       'bryuki-cargo-black',       'SKU-M-009', 5490, 6490,  15, id_men_pan, true, false, NOW(), NOW()),
  (p10, 'Куртка Bomber Olive',     'Куртка-бомбер оливкового цвета.',                       'Куртка-бомбер оливкового цвета',  'kurtka-bomber-olive',      'SKU-M-010', 12990,15990, 12, id_men_jac, true, true,  NOW(), NOW()),
  (p11, 'Куртка Denim Blue',       'Джинсовая куртка синего цвета.',                        'Джинсовая куртка синего цвета',   'kurtka-denim-blue',        'SKU-M-011', 9990, 11990, 20, id_men_jac, true, false, NOW(), NOW()),
  (p12, 'Пуховик Winter Black',    'Теплый пуховик черного цвета. Наполнитель 80% пух.',    'Теплый пуховик черного цвета',    'pukhovik-winter-black',    'SKU-M-012', 19990,24990,  8, id_men_jac, true, true,  NOW(), NOW()),
  (p13, 'Платье Midi Floral',      'Платье миди с цветочным принтом. Легкая вискоза.',      'Платье миди с цветочным принтом', 'plate-midi-floral',        'SKU-W-001', 7990, 9990,  18, id_w_dress, true, true,  NOW(), NOW()),
  (p14, 'Платье Mini Black',       'Маленькое черное платье. Классика гардероба.',           'Маленькое черное платье',         'plate-mini-black',         'SKU-W-002', 6990, NULL,  25, id_w_dress, true, true,  NOW(), NOW()),
  (p15, 'Платье Maxi Boho',        'Длинное платье в стиле бохо. Натуральный хлопок.',       'Длинное платье в стиле бохо',     'plate-maxi-boho',          'SKU-W-003', 8990, 10990, 14, id_w_dress, true, false, NOW(), NOW()),
  (p16, 'Топ Basic White',         'Базовый белый топ из хлопка.',                           'Базовый белый топ из хлопка',     'top-basic-white',          'SKU-W-004', 1990, 2490,  60, id_w_tops,  true, false, NOW(), NOW()),
  (p17, 'Топ Ribbed Beige',        'Рубчатый топ бежевого цвета. Облегающий крой.',          'Рубчатый топ бежевого цвета',     'top-ribbed-beige',         'SKU-W-005', 2490, NULL,  45, id_w_tops,  true, true,  NOW(), NOW()),
  (p18, 'Блуза Silk Pink',         'Блуза из искусственного шелка розового цвета.',          'Блуза из шелка розового цвета',   'bluza-silk-pink',          'SKU-W-006', 5990, 7490,  20, id_w_tops,  true, false, NOW(), NOW()),
  (p19, 'Джинсы Skinny Blue',      'Скинни джинсы синего цвета. Стрейч деним.',              'Скинни джинсы синего цвета',      'dzhinsy-skinny-blue',      'SKU-W-007', 6490, 7990,  35, id_w_pan,   true, true,  NOW(), NOW()),
  (p20, 'Брюки Wide Leg Black',    'Широкие брюки черного цвета. Высокая посадка.',          'Широкие брюки черного цвета',     'bryuki-wide-leg-black',    'SKU-W-008', 7490, NULL,  22, id_w_pan,   true, true,  NOW(), NOW()),
  (p21, 'Леггинсы Sport Grey',     'Спортивные леггинсы серого цвета.',                      'Спортивные леггинсы серого цвета','legginsy-sport-grey',      'SKU-W-009', 3490, 4490,  50, id_w_pan,   true, false, NOW(), NOW()),
  (p22, 'Куртка Trench Beige',     'Тренч бежевого цвета. Двубортный крой.',                 'Тренч бежевого цвета',            'kurtka-trench-beige',      'SKU-W-010', 14990,18990, 10, id_w_jac,   true, true,  NOW(), NOW()),
  (p23, 'Куртка Leather Black',    'Куртка из экокожи черного цвета.',                       'Куртка из экокожи черного цвета', 'kurtka-leather-black',     'SKU-W-011', 11990,14990, 15, id_w_jac,   true, false, NOW(), NOW()),
  (p24, 'Пальто Wool Grey',        'Пальто из шерстяного сукна серого цвета.',               'Пальто из шерстяного сукна',      'palto-wool-grey',          'SKU-W-012', 22990,27990,  8, id_w_jac,   true, true,  NOW(), NOW()),
  (p25, 'Худи Oversized Cream',    'Оверсайз худи кремового цвета. Мягкий флис внутри.',     'Оверсайз худи кремового цвета',   'khudi-oversized-cream',    'SKU-N-001', 5990, NULL,  30, id_new,     true, true,  NOW(), NOW()),
  (p26, 'Свитшот Vintage Grey',    'Свитшот серого цвета в винтажном стиле.',                'Свитшот серого цвета',            'svitskhot-vintage-grey',   'SKU-N-002', 4990, 5990,  25, id_new,     true, false, NOW(), NOW()),
  (p27, 'Кардиган Knit Brown',     'Вязаный кардиган коричневого цвета.',                    'Вязаный кардиган коричневого цвета','kardigan-knit-brown',     'SKU-N-003', 7990, 9490,  18, id_new,     true, true,  NOW(), NOW()),
  (p28, 'Костюм Linen Set Beige',  'Льняной костюм (пиджак + брюки) бежевого цвета.',        'Льняной костюм бежевого цвета',   'kostyum-linen-set-beige',  'SKU-N-004', 15990,19990, 10, id_new,     true, true,  NOW(), NOW()),
  (p29, 'Платье Knit Mini',        'Вязаное мини-платье. Облегающий крой.',                  'Вязаное мини-платье',             'plate-knit-mini',          'SKU-N-005', 6490, NULL,  20, id_new,     true, false, NOW(), NOW()),
  (p30, 'Куртка Puffer Lilac',     'Дутая куртка сиреневого цвета. Укороченный крой.',       'Дутая куртка сиреневого цвета',   'kurtka-puffer-lilac',      'SKU-N-006', 10990,13990, 12, id_new,     true, true,  NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 4. ИЗОБРАЖЕНИЯ
-- ============================================
INSERT INTO product_images (id, product_id, url, is_main, "order", created_at) VALUES
  (gen_random_uuid(), p1,  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', true, 0, NOW()),
  (gen_random_uuid(), p2,  'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600', true, 0, NOW()),
  (gen_random_uuid(), p3,  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600', true, 0, NOW()),
  (gen_random_uuid(), p4,  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600', true, 0, NOW()),
  (gen_random_uuid(), p5,  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600', true, 0, NOW()),
  (gen_random_uuid(), p6,  'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=600', true, 0, NOW()),
  (gen_random_uuid(), p7,  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600', true, 0, NOW()),
  (gen_random_uuid(), p8,  'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600',    true, 0, NOW()),
  (gen_random_uuid(), p9,  'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600', true, 0, NOW()),
  (gen_random_uuid(), p10, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600',    true, 0, NOW()),
  (gen_random_uuid(), p11, 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600', true, 0, NOW()),
  (gen_random_uuid(), p12, 'https://images.unsplash.com/photo-1547624643-3bf761b09502?w=600',    true, 0, NOW()),
  (gen_random_uuid(), p13, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600', true, 0, NOW()),
  (gen_random_uuid(), p14, 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600', true, 0, NOW()),
  (gen_random_uuid(), p15, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600', true, 0, NOW()),
  (gen_random_uuid(), p16, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600', true, 0, NOW()),
  (gen_random_uuid(), p17, 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600', true, 0, NOW()),
  (gen_random_uuid(), p18, 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600', true, 0, NOW()),
  (gen_random_uuid(), p19, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600', true, 0, NOW()),
  (gen_random_uuid(), p20, 'https://images.unsplash.com/photo-1594938298603-c8148c4b4357?w=600', true, 0, NOW()),
  (gen_random_uuid(), p21, 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600', true, 0, NOW()),
  (gen_random_uuid(), p22, 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=600',    true, 0, NOW()),
  (gen_random_uuid(), p23, 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600',    true, 0, NOW()),
  (gen_random_uuid(), p24, 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600', true, 0, NOW()),
  (gen_random_uuid(), p25, 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600',    true, 0, NOW()),
  (gen_random_uuid(), p26, 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600', true, 0, NOW()),
  (gen_random_uuid(), p27, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600', true, 0, NOW()),
  (gen_random_uuid(), p28, 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600', true, 0, NOW()),
  (gen_random_uuid(), p29, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600', true, 0, NOW()),
  (gen_random_uuid(), p30, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600', true, 0, NOW());

END $$;

-- Проверка
SELECT c.name as category, COUNT(p.id) as products
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.name ORDER BY c.name;
