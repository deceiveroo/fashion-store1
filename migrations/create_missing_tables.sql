-- Создание таблицы user_profiles (если не существует)
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  avatar TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Создание индекса для user_profiles
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);

-- Создание таблицы user_wishlist_items (если не существует)
CREATE TABLE IF NOT EXISTS user_wishlist_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Создание индексов для user_wishlist_items
CREATE UNIQUE INDEX IF NOT EXISTS user_wishlist_items_user_product_unique ON user_wishlist_items(user_id, product_id);
CREATE INDEX IF NOT EXISTS user_wishlist_items_user_idx ON user_wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS user_wishlist_items_product_idx ON user_wishlist_items(product_id);
