-- Add avatar column to user_profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'avatar') THEN
        ALTER TABLE user_profiles ADD COLUMN avatar TEXT;
    END IF;
END $$;