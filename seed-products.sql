-- Seed products for testing
-- Run this in Supabase SQL Editor

-- Insert 10 test products
INSERT INTO products (id, name, description, price, in_stock, featured) VALUES
('prod-1', 'Мужской товар 1', 'Описание для Мужской товар 1', 5699, true, true),
('prod-2', 'Мужской товар 2', 'Описание для Мужской товар 2', 7899, true, true),
('prod-3', 'Мужской товар 3', 'Описание для Мужской товар 3', 4599, true, true),
('prod-4', 'Мужской товар 4', 'Описание для Мужской товар 4', 8999, true, false),
('prod-5', 'Мужской товар 5', 'Описание для Мужской товар 5', 3499, true, false),
('prod-6', 'Женский товар 6', 'Описание для Женский товар 6', 6799, true, false),
('prod-7', 'Женский товар 7', 'Описание для Женский товар 7', 5299, true, false),
('prod-8', 'Женский товар 8', 'Описание для Женский товар 8', 9199, true, false),
('prod-9', 'Женский товар 9', 'Описание для Женский товар 9', 4399, true, false),
('prod-10', 'Женский товар 10', 'Описание для Женский товар 10', 7599, true, false)
ON CONFLICT (id) DO NOTHING;

-- Insert product images
INSERT INTO product_images (id, product_id, url, is_main, "order") VALUES
('img-prod-1', 'prod-1', 'https://placehold.co/400x400/3b82f6/white?text=Product+1', true, 0),
('img-prod-2', 'prod-2', 'https://placehold.co/400x400/3b82f6/white?text=Product+2', true, 0),
('img-prod-3', 'prod-3', 'https://placehold.co/400x400/3b82f6/white?text=Product+3', true, 0),
('img-prod-4', 'prod-4', 'https://placehold.co/400x400/3b82f6/white?text=Product+4', true, 0),
('img-prod-5', 'prod-5', 'https://placehold.co/400x400/3b82f6/white?text=Product+5', true, 0),
('img-prod-6', 'prod-6', 'https://placehold.co/400x400/ec4899/white?text=Product+6', true, 0),
('img-prod-7', 'prod-7', 'https://placehold.co/400x400/ec4899/white?text=Product+7', true, 0),
('img-prod-8', 'prod-8', 'https://placehold.co/400x400/ec4899/white?text=Product+8', true, 0),
('img-prod-9', 'prod-9', 'https://placehold.co/400x400/ec4899/white?text=Product+9', true, 0),
('img-prod-10', 'prod-10', 'https://placehold.co/400x400/ec4899/white?text=Product+10', true, 0)
ON CONFLICT (id) DO NOTHING;

-- Insert product-category links
INSERT INTO product_category (id, product_id, category_id) VALUES
(gen_random_uuid()::text, 'prod-1', 'men'),
(gen_random_uuid()::text, 'prod-2', 'men'),
(gen_random_uuid()::text, 'prod-3', 'men'),
(gen_random_uuid()::text, 'prod-4', 'men'),
(gen_random_uuid()::text, 'prod-5', 'men'),
(gen_random_uuid()::text, 'prod-6', 'women'),
(gen_random_uuid()::text, 'prod-7', 'women'),
(gen_random_uuid()::text, 'prod-8', 'women'),
(gen_random_uuid()::text, 'prod-9', 'women'),
(gen_random_uuid()::text, 'prod-10', 'women')
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_images FROM product_images;
SELECT COUNT(*) as total_links FROM product_category;
