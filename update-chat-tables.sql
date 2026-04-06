-- Add fields for admin takeover
ALTER TABLE support_chat_sessions 
ADD COLUMN IF NOT EXISTS taken_over_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS taken_over_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS ai_disabled BOOLEAN DEFAULT FALSE;

-- Update sender enum to include 'admin'
ALTER TABLE support_chat_messages 
DROP CONSTRAINT IF EXISTS support_chat_messages_sender_check;

ALTER TABLE support_chat_messages 
ADD CONSTRAINT support_chat_messages_sender_check 
CHECK (sender IN ('user', 'ai', 'admin'));

-- Success
SELECT 'Chat tables updated for admin takeover!' as message;
