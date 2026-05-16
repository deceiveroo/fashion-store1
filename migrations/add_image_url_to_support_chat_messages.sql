-- Add image_url column to support chat messages table if it doesn't exist
ALTER TABLE support_chat_messages 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Success
SELECT 'Support chat messages table updated with image_url column!' as message;