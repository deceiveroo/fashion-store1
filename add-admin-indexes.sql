-- Индексы для оптимизации админки
-- Применить: psql $DATABASE_URL -f add-admin-indexes.sql

-- Индексы для orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Индексы для order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Индексы для support_chat_sessions
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_status ON support_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_last_message_at ON support_chat_sessions(last_message_at DESC);

-- Индексы для support_chat_messages
CREATE INDEX IF NOT EXISTS idx_support_chat_messages_session_id ON support_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_messages_created_at ON support_chat_messages(created_at DESC);

-- Composite индекс для аналитики
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at DESC);

-- Индексы для products
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);

-- Индексы для users
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

ANALYZE orders;
ANALYZE order_items;
ANALYZE support_chat_sessions;
ANALYZE support_chat_messages;
ANALYZE products;
ANALYZE users;
