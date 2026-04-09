-- =====================================================
-- PROFILE TABLES MIGRATION FOR SUPABASE
-- FIXED VERSION: Uses UUID to match your users table
-- =====================================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS notification_settings CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;

-- 1. Payment Methods table
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'wallet')),
  last4 TEXT NOT NULL,
  brand TEXT NOT NULL,
  expiry_month INTEGER,
  expiry_year INTEGER,
  holder_name TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX payment_methods_user_idx ON payment_methods(user_id);

COMMENT ON TABLE payment_methods IS 'Stores user payment methods (cards and wallets)';

-- 2. User Sessions table
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device TEXT,
  location TEXT,
  ip TEXT,
  user_agent TEXT,
  last_active TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX user_sessions_user_idx ON user_sessions(user_id);
CREATE UNIQUE INDEX user_sessions_token_idx ON user_sessions(token);

COMMENT ON TABLE user_sessions IS 'Tracks user login sessions for security';

-- 3. Notification Settings table
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  orders_email BOOLEAN DEFAULT TRUE,
  orders_push BOOLEAN DEFAULT TRUE,
  orders_sms BOOLEAN DEFAULT FALSE,
  promotions_email BOOLEAN DEFAULT TRUE,
  promotions_push BOOLEAN DEFAULT FALSE,
  promotions_sms BOOLEAN DEFAULT FALSE,
  wishlist_email BOOLEAN DEFAULT TRUE,
  wishlist_push BOOLEAN DEFAULT TRUE,
  wishlist_sms BOOLEAN DEFAULT FALSE,
  price_drops_email BOOLEAN DEFAULT TRUE,
  price_drops_push BOOLEAN DEFAULT TRUE,
  price_drops_sms BOOLEAN DEFAULT FALSE,
  newsletter_email BOOLEAN DEFAULT TRUE,
  newsletter_push BOOLEAN DEFAULT FALSE,
  newsletter_sms BOOLEAN DEFAULT FALSE,
  security_email BOOLEAN DEFAULT TRUE,
  security_push BOOLEAN DEFAULT TRUE,
  security_sms BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX notification_settings_user_idx ON notification_settings(user_id);

COMMENT ON TABLE notification_settings IS 'User notification preferences';

-- 4. Add items column to orders table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='orders' AND column_name='items'
  ) THEN
    ALTER TABLE orders ADD COLUMN items JSONB;
  END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
SELECT 
  'payment_methods' as table_name, 
  COUNT(*) as row_count 
FROM payment_methods
UNION ALL
SELECT 
  'user_sessions' as table_name, 
  COUNT(*) as row_count 
FROM user_sessions
UNION ALL
SELECT 
  'notification_settings' as table_name, 
  COUNT(*) as row_count 
FROM notification_settings;
