-- Добавляем недостающие колонки в order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Product';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS color TEXT;
