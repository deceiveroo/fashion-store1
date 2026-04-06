-- Add missing columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_price DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'courier';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS recipient JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add missing columns to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS color TEXT;

-- Update existing order_items to have a name (copy from products if possible)
UPDATE order_items 
SET name = COALESCE(
  (SELECT products.name FROM products WHERE products.id = order_items.product_id),
  'Product'
)
WHERE name IS NULL;

-- Make name NOT NULL after populating
ALTER TABLE order_items ALTER COLUMN name SET NOT NULL;
