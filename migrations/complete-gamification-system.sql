-- Полная система достижений и геймификации
-- Выполнить этот SQL в Supabase SQL Editor

-- 1. Создаем все таблицы (если еще не созданы)
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  xp_to_next_level INTEGER NOT NULL DEFAULT 100,
  title TEXT NOT NULL DEFAULT 'Новичок',
  coins INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

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

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  seen BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_id, achievement_id)
);

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

CREATE TABLE IF NOT EXISTS user_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES daily_quests(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, quest_id, date)
);

CREATE TABLE IF NOT EXISTS xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_user_id ON user_quest_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_user_id ON xp_history(user_id);

-- 2. Seed данные: Достижения (полный набор)
INSERT INTO achievements (code, name, description, icon, category, xp_reward, coins_reward, rarity, requirement) VALUES
-- Покупки
('first_purchase', 'Первые шаги', 'Совершите первую покупку', '🛍️', 'shopping', 50, 10, 'common', '{"type": "purchase_count", "value": 1}'),
('fashionista', 'Модник', 'Совершите 10 покупок', '👗', 'shopping', 200, 50, 'rare', '{"type": "purchase_count", "value": 10}'),
('shopaholic', 'Шопоголик', 'Совершите 50 покупок', '🛒', 'shopping', 500, 150, 'epic', '{"type": "purchase_count", "value": 50}'),
('vip_member', 'VIP персона', 'Потратьте 100,000₽', '👑', 'shopping', 1000, 500, 'legendary', '{"type": "total_spent", "value": 100000}'),
('big_spender', 'Щедрый покупатель', 'Потратьте 10,000₽ за одну покупку', '💎', 'shopping', 300, 100, 'epic', '{"type": "single_purchase", "value": 10000}'),

-- Избранное
('collector', 'Коллекционер', 'Добавьте 10 товаров в избранное', '❤️', 'social', 100, 20, 'common', '{"type": "favorites_count", "value": 10}'),
('wishlist_master', 'Мастер желаний', 'Добавьте 50 товаров в избранное', '💖', 'social', 250, 75, 'rare', '{"type": "favorites_count", "value": 50}'),

-- Отзывы
('reviewer', 'Критик моды', 'Оставьте 5 отзывов', '⭐', 'social', 150, 30, 'rare', '{"type": "reviews_count", "value": 5}'),
('top_reviewer', 'Топ рецензент', 'Оставьте 20 отзывов', '🌟', 'social', 400, 120, 'epic', '{"type": "reviews_count", "value": 20}'),

-- Специальные
('early_bird', 'Ранняя пташка', 'Зайдите на сайт в 6 утра', '🌅', 'special', 50, 10, 'rare', '{"type": "login_time", "value": 6}'),
('night_owl', 'Сова', 'Зайдите на сайт в 2 ночи', '🦉', 'special', 50, 10, 'rare', '{"type": "login_time", "value": 2}'),
('streak_7', 'Неделя подряд', 'Заходите 7 дней подряд', '🔥', 'special', 200, 50, 'epic', '{"type": "login_streak", "value": 7}'),
('profile_complete', 'Профи', 'Заполните полный профиль', '👤', 'special', 100, 25, 'common', '{"type": "profile_complete", "value": 1}'),

-- Уровни
('level_5', 'Продвинутый', 'Достигните 5 уровня', '📈', 'progression', 150, 40, 'common', '{"type": "level_reached", "value": 5}'),
('level_10', 'Эксперт', 'Достигните 10 уровня', '🚀', 'progression', 300, 80, 'rare', '{"type": "level_reached", "value": 10}'),
('level_20', 'Мастер', 'Достигните 20 уровня', '🏆', 'progression', 500, 150, 'epic', '{"type": "level_reached", "value": 20}'),
('level_50', 'Легенда', 'Достигните 50 уровня', '👑', 'progression', 1000, 500, 'legendary', '{"type": "level_reached", "value": 50}')
ON CONFLICT (code) DO NOTHING;

-- 3. Seed данные: Ежедневные квесты
INSERT INTO daily_quests (code, name, description, icon, xp_reward, coins_reward, requirement, active) VALUES
('daily_login', 'Ежедневный визит', 'Зайдите на сайт сегодня', '🌟', 10, 5, '{"type": "login", "value": 1}', true),
('add_to_favorites', 'Найди любимое', 'Добавьте товар в избранное', '❤️', 15, 8, '{"type": "add_favorite", "value": 1}', true),
('view_products', 'Исследователь', 'Просмотрите 5 товаров', '👀', 20, 10, '{"type": "view_products", "value": 5}', true),
('add_to_cart', 'В корзину!', 'Добавьте товар в корзину', '🛒', 25, 12, '{"type": "add_to_cart", "value": 1}', true),
('share_product', 'Поделиться', 'Поделитесь товаром с другом', '📱', 30, 15, '{"type": "share", "value": 1}', true)
ON CONFLICT (code) DO NOTHING;

-- 4. Функция для автоматического создания уровня при регистрации пользователя
CREATE OR REPLACE FUNCTION create_user_level_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_levels (user_id, level, xp, xp_to_next_level, title, coins)
  VALUES (NEW.id, 1, 0, 100, 'Новичок', 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_user_level ON users;
CREATE TRIGGER trigger_create_user_level
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_level_on_signup();

-- 5. Функция для расчета XP до следующего уровня
CREATE OR REPLACE FUNCTION calculate_xp_to_next_level(current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Формула: 100 * level^1.5
  RETURN FLOOR(100 * POWER(current_level, 1.5));
END;
$$ LANGUAGE plpgsql;

-- 6. Функция для получения титула по уровню
CREATE OR REPLACE FUNCTION get_title_by_level(level INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN level >= 50 THEN 'Икона стиля 👑'
    WHEN level >= 40 THEN 'Легенда моды 🌟'
    WHEN level >= 30 THEN 'Гуру стиля 💎'
    WHEN level >= 20 THEN 'Модный эксперт 🏆'
    WHEN level >= 15 THEN 'Стиляга 🔥'
    WHEN level >= 10 THEN 'Модник ⭐'
    WHEN level >= 5 THEN 'Любитель моды ✨'
    ELSE 'Новичок 🌱'
  END;
END;
$$ LANGUAGE plpgsql;

-- 7. Функция для проверки и разблокировки достижений
CREATE OR REPLACE FUNCTION check_and_unlock_achievement(
  p_user_id TEXT,
  p_achievement_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_achievement_id UUID;
  v_already_unlocked BOOLEAN;
BEGIN
  -- Получаем ID достижения
  SELECT id INTO v_achievement_id
  FROM achievements
  WHERE code = p_achievement_code;
  
  IF v_achievement_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Проверяем, не разблокировано ли уже
  SELECT EXISTS(
    SELECT 1 FROM user_achievements
    WHERE user_id = p_user_id AND achievement_id = v_achievement_id
  ) INTO v_already_unlocked;
  
  IF v_already_unlocked THEN
    RETURN FALSE;
  END IF;
  
  -- Разблокируем достижение
  INSERT INTO user_achievements (user_id, achievement_id, unlocked_at, seen)
  VALUES (p_user_id, v_achievement_id, NOW(), FALSE);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE user_levels IS 'Уровни и прогресс пользователей';
COMMENT ON TABLE achievements IS 'Список всех достижений';
COMMENT ON TABLE user_achievements IS 'Разблокированные достижения пользователей';
COMMENT ON TABLE daily_quests IS 'Ежедневные квесты';
COMMENT ON TABLE user_quest_progress IS 'Прогресс выполнения квестов';
COMMENT ON TABLE xp_history IS 'История получения опыта';
