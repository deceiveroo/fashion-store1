-- Gamification System Tables
-- Система геймификации для модного магазина

-- Уровни пользователей
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  xp_to_next_level INTEGER NOT NULL DEFAULT 100,
  title TEXT NOT NULL DEFAULT 'Новичок',
  coins INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Достижения
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  coins_reward INTEGER NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL DEFAULT 'common',
  requirement JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Достижения пользователей
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  seen BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_id, achievement_id)
);

-- Ежедневные квесты
CREATE TABLE IF NOT EXISTS daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 10,
  coins_reward INTEGER NOT NULL DEFAULT 5,
  requirement JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Прогресс квестов
CREATE TABLE IF NOT EXISTS user_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES daily_quests(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, quest_id, date)
);

-- История XP
CREATE TABLE IF NOT EXISTS xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Лидерборд
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, period)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_user_id ON user_quest_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_user_id ON xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_period_rank ON leaderboard(period, rank);

-- Seed данные: Достижения
INSERT INTO achievements (code, name, description, icon, category, xp_reward, coins_reward, rarity, requirement) VALUES
-- Покупки
('first_purchase', 'Первые шаги', 'Совершите первую покупку', '🛍️', 'shopping', 50, 10, 'common', '{"type": "purchase_count", "value": 1}'),
('fashionista', 'Модник', 'Совершите 10 покупок', '👗', 'shopping', 200, 50, 'rare', '{"type": "purchase_count", "value": 10}'),
('shopaholic', 'Шопоголик', 'Совершите 50 покупок', '🛒', 'shopping', 500, 150, 'epic', '{"type": "purchase_count", "value": 50}'),
('vip_member', 'VIP персона', 'Потратьте 100,000₽', '👑', 'shopping', 1000, 500, 'legendary', '{"type": "total_spent", "value": 100000}'),

-- Социальные
('collector', 'Коллекционер', 'Добавьте 10 товаров в избранное', '❤️', 'social', 100, 20, 'common', '{"type": "favorites_count", "value": 10}'),
('reviewer', 'Критик моды', 'Оставьте 5 отзывов', '⭐', 'social', 150, 30, 'rare', '{"type": "reviews_count", "value": 5}'),
('influencer', 'Инфлюенсер', 'Пригласите 5 друзей', '📱', 'social', 300, 100, 'epic', '{"type": "referrals_count", "value": 5}'),

-- Специальные
('early_bird', 'Ранняя пташка', 'Зайдите на сайт в 6 утра', '🌅', 'special', 50, 10, 'rare', '{"type": "login_time", "value": 6}'),
('night_owl', 'Сова', 'Зайдите на сайт в 2 ночи', '🦉', 'special', 50, 10, 'rare', '{"type": "login_time", "value": 2}'),
('streak_7', 'Неделя подряд', 'Заходите 7 дней подряд', '🔥', 'special', 200, 50, 'epic', '{"type": "login_streak", "value": 7}'),
('birthday_bonus', 'С днём рождения!', 'Совершите покупку в день рождения', '🎂', 'special', 500, 200, 'legendary', '{"type": "birthday_purchase", "value": 1}')
ON CONFLICT (code) DO NOTHING;

-- Seed данные: Ежедневные квесты
INSERT INTO daily_quests (code, name, description, icon, xp_reward, coins_reward, requirement, active) VALUES
('daily_login', 'Ежедневный визит', 'Зайдите на сайт', '🌟', 10, 5, '{"type": "login", "value": 1}', true),
('add_to_favorites', 'Найди любимое', 'Добавьте товар в избранное', '❤️', 15, 8, '{"type": "add_favorite", "value": 1}', true),
('view_products', 'Исследователь', 'Просмотрите 5 товаров', '👀', 20, 10, '{"type": "view_products", "value": 5}', true),
('add_to_cart', 'В корзину!', 'Добавьте товар в корзину', '🛒', 25, 12, '{"type": "add_to_cart", "value": 1}', true),
('complete_profile', 'Заполни профиль', 'Заполните информацию о себе', '👤', 30, 15, '{"type": "complete_profile", "value": 1}', true)
ON CONFLICT DO NOTHING;

-- Функция для автоматического создания уровня при регистрации
CREATE OR REPLACE FUNCTION create_user_level()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_levels (user_id, level, xp, xp_to_next_level, title, coins)
  VALUES (NEW.id, 1, 0, 100, 'Новичок', 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для создания уровня
DROP TRIGGER IF EXISTS trigger_create_user_level ON auth.users;
CREATE TRIGGER trigger_create_user_level
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_level();

-- Функция для расчета XP до следующего уровня
CREATE OR REPLACE FUNCTION calculate_xp_to_next_level(current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Формула: 100 * level^1.5
  RETURN FLOOR(100 * POWER(current_level, 1.5));
END;
$$ LANGUAGE plpgsql;

-- Функция для получения титула по уровню
CREATE OR REPLACE FUNCTION get_title_by_level(level INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN level >= 50 THEN 'Икона стиля'
    WHEN level >= 40 THEN 'Легенда моды'
    WHEN level >= 30 THEN 'Гуру стиля'
    WHEN level >= 20 THEN 'Модный эксперт'
    WHEN level >= 15 THEN 'Стиляга'
    WHEN level >= 10 THEN 'Модник'
    WHEN level >= 5 THEN 'Любитель моды'
    ELSE 'Новичок'
  END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE user_levels IS 'Уровни и прогресс пользователей';
COMMENT ON TABLE achievements IS 'Список всех достижений';
COMMENT ON TABLE user_achievements IS 'Разблокированные достижения пользователей';
COMMENT ON TABLE daily_quests IS 'Ежедневные квесты';
COMMENT ON TABLE user_quest_progress IS 'Прогресс выполнения квестов';
COMMENT ON TABLE xp_history IS 'История получения опыта';
COMMENT ON TABLE leaderboard IS 'Таблица лидеров';
