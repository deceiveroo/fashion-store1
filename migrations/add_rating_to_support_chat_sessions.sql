-- Add rating columns to support chat sessions table
ALTER TABLE support_chat_sessions 
ADD COLUMN IF NOT EXISTS operator_rating INTEGER,
ADD COLUMN IF NOT EXISTS operator_rated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS operator_rated_by TEXT;

-- Success
SELECT 'Support chat sessions table updated with rating columns!' as message;