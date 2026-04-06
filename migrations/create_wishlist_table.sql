-- Создание таблицы для избранных товаров (wishlist)
CREATE TABLE IF NOT EXISTS user_wishlist_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS user_wishlist_items_user_idx ON user_wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS user_wishlist_items_product_idx ON user_wishlist_items(product_id);
