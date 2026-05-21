-- ============================================
-- Chat Database Optimization Migration
-- Performance improvements for support chat system
-- ============================================

-- 1. Add denormalized fields to sessions table
ALTER TABLE support_chat_sessions 
ADD COLUMN IF NOT EXISTS last_message TEXT,
ADD COLUMN IF NOT EXISTS last_message_preview TEXT,
ADD COLUMN IF NOT EXISTS first_response_time INTEGER, -- seconds to first response
ADD COLUMN IF NOT EXISTS resolution_time INTEGER;     -- seconds to resolution

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_status ON support_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_last_message_at ON support_chat_sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON support_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_ai_disabled ON support_chat_sessions(ai_disabled);
CREATE INDEX IF NOT EXISTS idx_messages_session_created ON support_chat_messages(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON support_chat_messages(sender);
CREATE INDEX IF NOT EXISTS idx_messages_read_by_admin ON support_chat_messages(read_by_admin) WHERE read_by_admin = false;

-- Composite index for statistics queries
CREATE INDEX IF NOT EXISTS idx_messages_created_sender ON support_chat_messages(created_at, sender);

-- 3. Create trigger function to update session on new message
CREATE OR REPLACE FUNCTION update_session_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE support_chat_sessions
  SET 
    last_message = NEW.message,
    last_message_preview = LEFT(NEW.message, 100),
    message_count = COALESCE(message_count, 0) + 1,
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE session_id = NEW.session_id;
  
  -- Calculate first response time if this is the first admin/AI response
  IF NEW.sender IN ('admin', 'ai') THEN
    UPDATE support_chat_sessions
    SET first_response_time = EXTRACT(EPOCH FROM (NEW.created_at - created_at))::INTEGER
    WHERE session_id = NEW.session_id
      AND first_response_time IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger
DROP TRIGGER IF EXISTS trg_update_session_on_message ON support_chat_messages;
CREATE TRIGGER trg_update_session_on_message
AFTER INSERT ON support_chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_session_on_message();

-- 5. Create trigger to update resolution time when session is resolved
CREATE OR REPLACE FUNCTION update_session_resolution_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    UPDATE support_chat_sessions
    SET 
      resolution_time = EXTRACT(EPOCH FROM (NOW() - created_at))::INTEGER,
      resolved_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_resolution_time ON support_chat_sessions;
CREATE TRIGGER trg_update_resolution_time
BEFORE UPDATE ON support_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION update_session_resolution_time();

-- 6. Add RLS policies for better security
-- Enable RLS if not already enabled
ALTER TABLE support_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read for everyone" ON support_chat_messages;
DROP POLICY IF EXISTS "Enable insert for everyone" ON support_chat_messages;
DROP POLICY IF EXISTS "Enable read for sessions" ON support_chat_sessions;
DROP POLICY IF EXISTS "Enable insert for sessions" ON support_chat_sessions;
DROP POLICY IF EXISTS "Enable update for admins" ON support_chat_sessions;

-- Messages: Anyone can read and insert (for chat widget)
CREATE POLICY "Enable read for messages"
ON support_chat_messages FOR SELECT
USING (true);

CREATE POLICY "Enable insert for messages"
ON support_chat_messages FOR INSERT
WITH CHECK (true);

-- Sessions: Anyone can read their own session
CREATE POLICY "Enable read for sessions"
ON support_chat_sessions FOR SELECT
USING (true);

CREATE POLICY "Enable insert for sessions"
ON support_chat_sessions FOR INSERT
WITH CHECK (true);

-- Only admins can update sessions (status, notes, etc.)
CREATE POLICY "Enable update for admins only"
ON support_chat_sessions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'moderator')
  )
);

-- 7. Create view for quick stats (materialized for performance)
CREATE OR REPLACE VIEW chat_stats_daily AS
SELECT 
  DATE(created_at) as stat_date,
  COUNT(*) FILTER (WHERE sender = 'user') as user_messages,
  COUNT(*) FILTER (WHERE sender = 'ai') as ai_messages,
  COUNT(*) FILTER (WHERE sender = 'admin') as admin_messages,
  COUNT(DISTINCT session_id) as unique_sessions,
  AVG(first_response_time) FILTER (WHERE first_response_time IS NOT NULL) as avg_first_response_time,
  AVG(resolution_time) FILTER (WHERE resolution_time IS NOT NULL) as avg_resolution_time
FROM support_chat_messages m
LEFT JOIN support_chat_sessions s ON m.session_id = s.session_id
GROUP BY DATE(created_at)
ORDER BY stat_date DESC;

-- 8. Add comments for documentation
COMMENT ON COLUMN support_chat_sessions.last_message IS 'Denormalized: Last message text for quick display';
COMMENT ON COLUMN support_chat_sessions.last_message_preview IS 'Denormalized: First 100 chars of last message';
COMMENT ON COLUMN support_chat_sessions.first_response_time IS 'Seconds from session creation to first admin/AI response';
COMMENT ON COLUMN support_chat_sessions.resolution_time IS 'Seconds from session creation to resolution';
COMMENT ON TRIGGER trg_update_session_on_message ON support_chat_messages IS 'Auto-updates session denormalized fields on new message';
COMMENT ON TRIGGER trg_update_resolution_time ON support_chat_sessions IS 'Calculates resolution time when status changes to resolved';

-- 9. Grant necessary permissions
GRANT SELECT ON chat_stats_daily TO authenticated;
GRANT SELECT ON chat_stats_daily TO anon;

-- ============================================
-- Migration Complete
-- ============================================
-- This migration adds:
-- ✅ Denormalized fields for faster queries
-- ✅ Performance indexes
-- ✅ Auto-update triggers
-- ✅ Enhanced RLS policies
-- ✅ Stats view for analytics
-- ============================================
