-- Add Support Chat tables to database

-- Support Chat Sessions table
CREATE TABLE IF NOT EXISTS support_chat_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  message_count INTEGER DEFAULT 0,
  first_message TEXT,
  last_message_at TIMESTAMP,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Support Chat Messages table
CREATE TABLE IF NOT EXISTS support_chat_messages (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  message TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  ai_model TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS support_chat_sessions_session_id_idx ON support_chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS support_chat_sessions_user_idx ON support_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS support_chat_sessions_status_idx ON support_chat_sessions(status);
CREATE INDEX IF NOT EXISTS support_chat_sessions_created_at_idx ON support_chat_sessions(created_at);

CREATE INDEX IF NOT EXISTS support_chat_messages_session_idx ON support_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS support_chat_messages_user_idx ON support_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS support_chat_messages_created_at_idx ON support_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS support_chat_messages_sender_idx ON support_chat_messages(sender);

-- Add foreign key constraint for messages to sessions
ALTER TABLE support_chat_messages 
ADD CONSTRAINT fk_chat_messages_session 
FOREIGN KEY (session_id) 
REFERENCES support_chat_sessions(session_id) 
ON DELETE CASCADE;

-- Enable RLS (Row Level Security)
ALTER TABLE support_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_chat_sessions
CREATE POLICY "Admins can view all chat sessions" ON support_chat_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'manager', 'support')
    )
  );

CREATE POLICY "Users can view their own chat sessions" ON support_chat_sessions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can create chat sessions" ON support_chat_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update chat sessions" ON support_chat_sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'manager', 'support')
    )
  );

-- RLS Policies for support_chat_messages
CREATE POLICY "Admins can view all chat messages" ON support_chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'manager', 'support')
    )
  );

CREATE POLICY "Users can view their own chat messages" ON support_chat_messages
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can create chat messages" ON support_chat_messages
  FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON support_chat_sessions TO authenticated;
GRANT SELECT, INSERT ON support_chat_messages TO authenticated;
GRANT ALL ON support_chat_sessions TO service_role;
GRANT ALL ON support_chat_messages TO service_role;

-- Success message
SELECT 'Support chat tables created successfully!' as message;
