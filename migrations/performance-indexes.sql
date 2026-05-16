-- Performance optimization indexes for fashion-store database

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_category_instock ON products(category_id, in_stock) WHERE in_stock = true;
CREATE INDEX IF NOT EXISTS idx_products_featured_active ON products(featured, in_stock) WHERE featured = true AND in_stock = true;
CREATE INDEX IF NOT EXISTS idx_products_price_range ON products(price) WHERE in_stock = true;
CREATE INDEX IF NOT EXISTS idx_products_created_recent ON products(created_at DESC) WHERE in_stock = true;

-- Product images indexes
CREATE INDEX IF NOT EXISTS idx_product_images_main ON product_images(product_id, is_main) WHERE is_main = true;
CREATE INDEX IF NOT EXISTS idx_product_images_order ON product_images(product_id, "order");

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active) WHERE is_active = true;

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_date ON orders(created_at DESC);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Favorites/Wishlist indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_user_product ON user_wishlist_items(user_id, product_id);

-- Product views (for trending recommendations)
CREATE INDEX IF NOT EXISTS idx_product_views_recent ON product_views(viewed_at DESC, product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_7days ON product_views(product_id, viewed_at) WHERE viewed_at > NOW() - INTERVAL '7 days';

-- Curated collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_active ON curated_collections(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_collection_items_order ON collection_items(collection_id, sort_order);

-- Sessions and auth indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_accounts_user_provider ON accounts(user_id, provider);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- Support chat indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON support_chat_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON support_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON support_chat_messages(session_id, created_at ASC);

-- Gamification indexes
CREATE INDEX IF NOT EXISTS idx_user_points_user ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_user ON user_badges(user_id, earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements(user_id, unlocked_at DESC);

-- Gift cards indexes
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_expiring ON gift_cards(expires_at) WHERE status = 'sent';

-- Bundle deals indexes
CREATE INDEX IF NOT EXISTS idx_bundles_active ON bundle_deals(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON bundle_items(bundle_id, sort_order);
