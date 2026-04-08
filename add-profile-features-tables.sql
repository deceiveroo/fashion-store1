-- Добавление таблиц для функций профиля
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. Расширение таблицы user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS weight INTEGER,
ADD COLUMN IF NOT EXISTS body_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS favorite_colors TEXT[], -- массив цветов
ADD COLUMN IF NOT EXISTS favorite_brands TEXT[], -- массив брендов
ADD COLUMN IF NOT EXISTS eco_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS carbon_footprint DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS water_saved DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS trees_equivalent INTEGER DEFAULT 0;

-- 2. Таблица для отслеживания цен (Digital Twin)
CREATE TABLE IF NOT EXISTS price_watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  target_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Таблица для вишлиста подарков
CREATE TABLE IF NOT EXISTS gift_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT TRUE,
  is_purchased BOOLEAN DEFAULT FALSE,
  size VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Таблица для настроек вишлиста
CREATE TABLE IF NOT EXISTS wishlist_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  max_budget DECIMAL(10, 2) DEFAULT 20000,
  min_budget DECIMAL(10, 2) DEFAULT 1000,
  excluded_categories TEXT[], -- массив исключенных категорий
  share_token VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Таблица для активных сессий
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device VARCHAR(255),
  location VARCHAR(255),
  ip_address VARCHAR(50),
  user_agent TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Таблица для истории входов
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device VARCHAR(255),
  location VARCHAR(255),
  ip_address VARCHAR(50),
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Таблица для способов оплаты
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'card' или 'wallet'
  last4 VARCHAR(4) NOT NULL,
  brand VARCHAR(50) NOT NULL, -- 'Visa', 'Mastercard', 'YooMoney' и т.д.
  expiry_month INTEGER,
  expiry_year INTEGER,
  holder_name VARCHAR(255),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Таблица для настроек уведомлений
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  orders_email BOOLEAN DEFAULT TRUE,
  orders_push BOOLEAN DEFAULT TRUE,
  orders_sms BOOLEAN DEFAULT TRUE,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Таблица для умных напоминаний
CREATE TABLE IF NOT EXISTS smart_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  frequency_days INTEGER NOT NULL, -- каждые N дней
  next_reminder_date DATE NOT NULL,
  last_purchase_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Таблица для эко-достижений
CREATE TABLE IF NOT EXISTS eco_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL, -- 'eco_warrior', 'tree_planter', 'water_saver', 'carbon_neutral'
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- 11. Таблица для AI рекомендаций (кэш)
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  match_percentage INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
);

-- 12. Создание индексов
CREATE INDEX IF NOT EXISTS idx_price_watches_user ON price_watches(user_id);
CREATE INDEX IF NOT EXISTS idx_price_watches_product ON price_watches(product_id);
CREATE INDEX IF NOT EXISTS idx_gift_wishlist_user ON gift_wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_wishlist_public ON gift_wishlist(is_public);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_reminders_user ON smart_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_reminders_date ON smart_reminders(next_reminder_date);
CREATE INDEX IF NOT EXISTS idx_eco_achievements_user ON eco_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_expires ON ai_recommendations(expires_at);

-- 13. Триггеры для updated_at
CREATE TRIGGER update_price_watches_updated_at BEFORE UPDATE ON price_watches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gift_wishlist_updated_at BEFORE UPDATE ON gift_wishlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlist_settings_updated_at BEFORE UPDATE ON wishlist_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smart_reminders_updated_at BEFORE UPDATE ON smart_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. RLS политики
ALTER TABLE price_watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Price watches
CREATE POLICY "Users can manage own price watches" ON price_watches
  FOR ALL USING (auth.uid() = user_id);

-- Gift wishlist - публичное чтение для is_public=true
CREATE POLICY "Users can manage own wishlist" ON gift_wishlist
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public wishlist items are readable" ON gift_wishlist
  FOR SELECT USING (is_public = true);

-- Wishlist settings
CREATE POLICY "Users can manage own wishlist settings" ON wishlist_settings
  FOR ALL USING (auth.uid() = user_id);

-- User sessions
CREATE POLICY "Users can read own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Login history
CREATE POLICY "Users can read own login history" ON login_history
  FOR SELECT USING (auth.uid() = user_id);

-- Payment methods
CREATE POLICY "Users can manage own payment methods" ON payment_methods
  FOR ALL USING (auth.uid() = user_id);

-- Notification settings
CREATE POLICY "Users can manage own notification settings" ON notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- Smart reminders
CREATE POLICY "Users can manage own reminders" ON smart_reminders
  FOR ALL USING (auth.uid() = user_id);

-- Eco achievements
CREATE POLICY "Users can read own achievements" ON eco_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- AI recommendations
CREATE POLICY "Users can read own recommendations" ON ai_recommendations
  FOR SELECT USING (auth.uid() = user_id);

-- 15. Функция для генерации share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 16. Функция для автоматического создания настроек при регистрации
CREATE OR REPLACE FUNCTION create_default_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Создаем настройки уведомлений
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Создаем настройки вишлиста
  INSERT INTO wishlist_settings (user_id, share_token)
  VALUES (NEW.id, generate_share_token())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 17. Триггер для создания настроек при регистрации
DROP TRIGGER IF EXISTS create_user_default_settings ON users;
CREATE TRIGGER create_user_default_settings
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_settings();

-- Готово!
SELECT 'Profile features tables created successfully!' as message;
