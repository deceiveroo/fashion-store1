-- Исправление схемы базы данных
-- Добавление недостающих колонок и исправление несоответствий

-- ============================================
-- 1. ИСПРАВЛЕНИЕ ТАБЛИЦЫ USERS
-- ============================================

-- Добавляем недостающие колонки в users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ============================================
-- 2. ИСПРАВЛЕНИЕ ТАБЛИЦЫ CATEGORIES
-- ============================================

-- Добавляем недостающие колонки в categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS materialized_path TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'ru';

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_position ON categories(position);
CREATE INDEX IF NOT EXISTS idx_categories_is_featured ON categories(is_featured);

-- ============================================
-- 3. ИСПРАВЛЕНИЕ ТАБЛИЦЫ PRODUCTS
-- ============================================

-- Добавляем недостающие колонки в products
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100) UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(8, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_desc TEXT;

-- Генерируем SKU для существующих продуктов без SKU
UPDATE products 
SET sku = 'SKU-' || SUBSTRING(id::text, 1, 8)
WHERE sku IS NULL;

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- ============================================
-- 4. ИСПРАВЛЕНИЕ ТАБЛИЦЫ USER_PROFILES
-- ============================================

-- Добавляем недостающие колонки в user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Создаем индекс
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- ============================================
-- 5. ИСПРАВЛЕНИЕ ТАБЛИЦЫ PRODUCT_IMAGES
-- ============================================

-- Переименовываем колонку is_primary в is_main (если нужно)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_images' AND column_name = 'is_primary'
  ) THEN
    ALTER TABLE product_images RENAME COLUMN is_primary TO is_main;
  END IF;
END $$;

-- Добавляем колонку order если её нет
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Создаем индекс
CREATE INDEX IF NOT EXISTS idx_product_images_product_order ON product_images(product_id, "order");

-- ============================================
-- 6. ИСПРАВЛЕНИЕ ТАБЛИЦЫ ORDERS
-- ============================================

-- Добавляем недостающие колонки в orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_price DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(100) DEFAULT 'courier';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100) DEFAULT 'card';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS recipient JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS comment TEXT;

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ============================================
-- 7. СОЗДАНИЕ ТАБЛИЦЫ PRODUCT_VARIANTS (если нужна)
-- ============================================

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(50),
  color VARCHAR(50),
  sku VARCHAR(100) UNIQUE NOT NULL,
  stock INTEGER DEFAULT 0,
  price_adjustment DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

-- ============================================
-- 8. СОЗДАНИЕ ТАБЛИЦЫ PRODUCT_CATEGORY (многие-ко-многим)
-- ============================================

CREATE TABLE IF NOT EXISTS product_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_product_category_product_id ON product_category(product_id);
CREATE INDEX IF NOT EXISTS idx_product_category_category_id ON product_category(category_id);

-- ============================================
-- 9. СОЗДАНИЕ ТАБЛИЦЫ SESSIONS (для NextAuth)
-- ============================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token);

-- ============================================
-- 10. СОЗДАНИЕ ТАБЛИЦЫ ACCOUNTS (для NextAuth OAuth)
-- ============================================

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(50),
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- ============================================
-- 11. СОЗДАНИЕ ТАБЛИЦЫ VERIFICATION_TOKENS (для NextAuth)
-- ============================================

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(identifier, token)
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);

-- ============================================
-- 12. СОЗДАНИЕ ТАБЛИЦЫ CART_ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- ============================================
-- 13. СОЗДАНИЕ ТАБЛИЦЫ USER_WISHLIST_ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS user_wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_user_wishlist_items_user_id ON user_wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wishlist_items_product_id ON user_wishlist_items(product_id);

-- ============================================
-- 14. СОЗДАНИЕ ТАБЛИЦЫ COUPONS
-- ============================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- percentage, fixed, free_shipping
  value DECIMAL(10, 2) NOT NULL,
  min_amount DECIMAL(10, 2) DEFAULT 0,
  usage_limit INTEGER,
  per_user_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active);

-- ============================================
-- 15. СОЗДАНИЕ ТАБЛИЦЫ SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- ============================================
-- 16. СОЗДАНИЕ ТАБЛИЦЫ ACTIVITY_LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================
-- 17. ДОБАВЛЕНИЕ ТРИГГЕРОВ ДЛЯ НОВЫХ ТАБЛИЦ
-- ============================================

-- Триггер для product_variants
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at 
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для cart_items
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at 
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для coupons
DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at 
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для settings
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at 
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 18. ОБНОВЛЕНИЕ RLS ПОЛИТИК
-- ============================================

-- Включаем RLS для новых таблиц
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Политики для product_variants
CREATE POLICY "Product variants are publicly readable" ON product_variants
  FOR SELECT USING (true);

-- Политики для product_category
CREATE POLICY "Product categories are publicly readable" ON product_category
  FOR SELECT USING (true);

-- Политики для cart_items
CREATE POLICY "Users can manage own cart" ON cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Политики для user_wishlist_items
CREATE POLICY "Users can manage own wishlist" ON user_wishlist_items
  FOR ALL USING (auth.uid() = user_id);

-- Политики для coupons
CREATE POLICY "Coupons are publicly readable" ON coupons
  FOR SELECT USING (active = true);

-- ============================================
-- 19. ПРОВЕРКА РЕЗУЛЬТАТОВ
-- ============================================

-- Проверяем структуру таблицы users
SELECT 
  'users' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Проверяем структуру таблицы categories
SELECT 
  'categories' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- Проверяем структуру таблицы products
SELECT 
  'products' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Проверяем структуру таблицы user_profiles
SELECT 
  'user_profiles' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- ============================================
-- ГОТОВО!
-- ============================================

SELECT '✅ Схема базы данных успешно обновлена!' as status,
       'Все недостающие колонки и таблицы добавлены' as message,
       'Теперь можно использовать приложение' as next_step;
