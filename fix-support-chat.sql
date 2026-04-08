-- Полное исправление таблиц чата поддержки
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. Удаляем старые таблицы если есть проблемы
DROP TABLE IF EXISTS support_chat_messages CASCADE;
DROP TABLE IF EXISTS support_chat_sessions CASCADE;

-- 2. Создаем таблицу сессий чата
CREATE TABLE support_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active', -- active, resolved, closed
  ai_disabled BOOLEAN DEFAULT FALSE,
  taken_over_by UUID REFERENCES users(id) ON DELETE SET NULL,
  taken_over_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,
  first_message TEXT,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP,
  rating INTEGER, -- 1-5 stars
  rated_at TIMESTAMP,
  user_agent TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Создаем таблицу сообщений
CREATE TABLE support_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'ai', 'admin')),
  ai_model VARCHAR(100),
  image_url TEXT,
  read_by_admin BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Создаем индексы для производительности
CREATE INDEX idx_support_chat_sessions_session_id ON support_chat_sessions(session_id);
CREATE INDEX idx_support_chat_sessions_status ON support_chat_sessions(status);
CREATE INDEX idx_support_chat_sessions_created_at ON support_chat_sessions(created_at);
CREATE INDEX idx_support_chat_sessions_taken_over ON support_chat_sessions(taken_over_by);

CREATE INDEX idx_support_chat_messages_session_id ON support_chat_messages(session_id);
CREATE INDEX idx_support_chat_messages_sender ON support_chat_messages(sender);
CREATE INDEX idx_support_chat_messages_created_at ON support_chat_messages(created_at);
CREATE INDEX idx_support_chat_messages_read ON support_chat_messages(read_by_admin);

-- 5. Создаем функцию для обновления updated_at
CREATE OR REPLACE FUNCTION update_support_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Создаем триггер
DROP TRIGGER IF EXISTS support_chat_sessions_updated_at ON support_chat_sessions;
CREATE TRIGGER support_chat_sessions_updated_at
  BEFORE UPDATE ON support_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_support_chat_sessions_updated_at();

-- 7. RLS политики
ALTER TABLE support_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_chat_messages ENABLE ROW LEVEL SECURITY;

-- Админы могут видеть все
CREATE POLICY "Admins can view all chat sessions" ON support_chat_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can update chat sessions" ON support_chat_sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can view all messages" ON support_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can insert messages" ON support_chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'staff')
    )
  );

-- 8. Вставляем тестовые данные
INSERT INTO support_chat_sessions (session_id, user_name, status, first_message, message_count, last_message_at)
VALUES 
  ('test_session_1', 'Тестовый пользователь', 'active', 'Привет! Как оформить доставку?', 2, NOW()),
  ('test_session_2', 'Гость', 'resolved', 'Вопрос по возврату', 5, NOW() - INTERVAL '1 hour')
ON CONFLICT (session_id) DO NOTHING;

INSERT INTO support_chat_messages (session_id, message, sender, ai_model)
VALUES 
  ('test_session_1', 'Привет! Как оформить доставку?', 'user', NULL),
  ('test_session_1', '📦 Доставка: Курьер 1-3 дня (бесплатно от 5000₽)', 'ai', 'fallback')
ON CONFLICT DO NOTHING;

-- Готово!
SELECT 'Support chat tables created successfully!' as message;

-- Проверка
SELECT 
  'Sessions: ' || COUNT(*) as sessions_count
FROM support_chat_sessions;

SELECT 
  'Messages: ' || COUNT(*) as messages_count
FROM support_chat_messages;
