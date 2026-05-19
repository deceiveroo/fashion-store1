-- Complete Achievement System - Fashion Store
-- Execute in Supabase SQL Editor

-- Clear existing achievements (if any)
DELETE FROM user_achievements;
DELETE FROM achievements;

-- Insert comprehensive achievement system
INSERT INTO achievements (code, name, description, icon, category, xp_reward, coins_reward, rarity, requirement) VALUES

-- 🛍️ SHOPPING ACHIEVEMENTS (Покупки)
('first_purchase', 'Первые шаги', 'Совершите первую покупку', '🛍️', 'shopping', 50, 10, 'common', '{"type": "purchase_count", "value": 1}'),
('second_chance', 'Второй шанс', 'Совершите 2 покупки', '🛒', 'shopping', 75, 15, 'common', '{"type": "purchase_count", "value": 2}'),
('regular_customer', 'Постоянный клиент', 'Совершите 5 покупок', '👕', 'shopping', 150, 30, 'uncommon', '{"type": "purchase_count", "value": 5}'),
('fashionista', 'Модник', 'Совершите 10 покупок', '👗', 'shopping', 200, 50, 'rare', '{"type": "purchase_count", "value": 10}'),
('loyal_shopper', 'Верный покупатель', 'Совершите 25 покупок', '💼', 'shopping', 400, 100, 'epic', '{"type": "purchase_count", "value": 25}'),
('shopaholic', 'Шопоголик', 'Совершите 50 покупок', '🏪', 'shopping', 500, 150, 'epic', '{"type": "purchase_count", "value": 50}'),
('vip_member', 'VIP персона', 'Потратьте 100,000₽ всего', '👑', 'shopping', 1000, 500, 'legendary', '{"type": "total_spent", "value": 100000}'),
('big_spender', 'Щедрый покупатель', 'Потратьте 10,000₽ за одну покупку', '💎', 'shopping', 300, 100, 'epic', '{"type": "single_purchase", "value": 10000}'),
('whale', 'Кит', 'Потратьте 500,000₽ всего', '🐋', 'shopping', 2000, 1000, 'legendary', '{"type": "total_spent", "value": 500000}'),

-- 📦 ORDER MANAGEMENT (Заказы)
('order_tracker', 'Отслеживатель', 'Проверьте статус заказа 5 раз', '📊', 'orders', 50, 10, 'common', '{"type": "order_checks", "value": 5}'),
('receipt_collector', 'Коллекционер чеков', 'Скачайте 3 чека', '🧾', 'orders', 75, 15, 'uncommon', '{"type": "receipt_downloads", "value": 3}'),
('support_user', 'Общительный', 'Напишите в поддержку', '💬', 'orders', 50, 10, 'common', '{"type": "support_chat", "value": 1}'),

-- ❤️ WISHLIST & FAVORITES (Избранное)
('first_favorite', 'Первая любовь', 'Добавьте первый товар в избранное', '❤️', 'wishlist', 25, 5, 'common', '{"type": "favorites_count", "value": 1}'),
('collector', 'Коллекционер', 'Добавьте 10 товаров в избранное', '💕', 'wishlist', 100, 20, 'uncommon', '{"type": "favorites_count", "value": 10}'),
('wishlist_master', 'Мастер желаний', 'Добавьте 50 товаров в избранное', '💖', 'wishlist', 250, 75, 'rare', '{"type": "favorites_count", "value": 50}'),
('wishlist_hoarder', 'Хранитель желаний', 'Добавьте 100 товаров в избранное', '💝', 'wishlist', 500, 150, 'epic', '{"type": "favorites_count", "value": 100}'),

-- 🔍 BROWSING & DISCOVERY (Просмотры)
('window_shopper', 'Витринный покупатель', 'Посмотрите 20 товаров', '👀', 'browsing', 50, 10, 'common', '{"type": "product_views", "value": 20}'),
('explorer', 'Исследователь', 'Посмотрите 100 товаров', '🔍', 'browsing', 150, 30, 'uncommon', '{"type": "product_views", "value": 100}'),
('catalog_master', 'Знаток каталога', 'Посмотрите 500 товаров', '📚', 'browsing', 300, 75, 'rare', '{"type": "product_views", "value": 500}'),
('category_explorer', 'Путешественник', 'Посетите все категории', '🗺️', 'browsing', 200, 50, 'rare', '{"type": "categories_visited", "value": 6}'),

-- 💰 SAVINGS & COUPONS (Экономия)
('coupon_hunter', 'Охотник за купонами', 'Используйте первый промокод', '🎫', 'savings', 50, 10, 'common', '{"type": "coupons_used", "value": 1}'),
('smart_shopper', 'Умный покупатель', 'Используйте 5 промокодов', '🎟️', 'savings', 150, 30, 'uncommon', '{"type": "coupons_used", "value": 5}'),
('discount_master', 'Мастер скидок', 'Используйте 20 промокодов', '💸', 'savings', 400, 100, 'epic', '{"type": "coupons_used", "value": 20}'),
('saver', 'Экономный', 'Сэкономьте 5,000₽ на скидках', '🏷️', 'savings', 200, 50, 'rare', '{"type": "total_saved", "value": 5000}'),
('super_saver', 'Супер экономный', 'Сэкономьте 20,000₽ на скидках', '💰', 'savings', 500, 150, 'epic', '{"type": "total_saved", "value": 20000}'),

-- 📱 PROFILE & ACCOUNT (Профиль)
('profile_complete', 'Профи', 'Заполните профиль полностью', '✅', 'profile', 100, 20, 'uncommon', '{"type": "profile_completion", "value": 100}'),
('avatar_setter', 'Лицо бренда', 'Установите аватар', '📸', 'profile', 50, 10, 'common', '{"type": "avatar_uploaded", "value": 1}'),
('phone_verified', 'На связи', 'Добавьте номер телефона', '📞', 'profile', 50, 10, 'common', '{"type": "phone_added", "value": 1}'),
('address_setter', 'Адресат', 'Добавьте адрес доставки', '🏠', 'profile', 50, 10, 'common', '{"type": "address_added", "value": 1}'),

-- 🔐 SECURITY & LOGIN (Безопасность)
('early_bird', 'Ранняя пташка', 'Зайдите на сайт в 6 утра', '🌅', 'security', 50, 10, 'rare', '{"type": "login_time", "value": 6}'),
('night_owl', 'Сова', 'Зайдите на сайт в 2 ночи', '🦉', 'security', 50, 10, 'rare', '{"type": "login_time", "value": 2}'),
('weekend_warrior', 'Выходной воин', 'Зайдите в выходной день', '🎉', 'security', 50, 10, 'uncommon', '{"type": "login_weekend", "value": 1}'),
('daily_visitor', 'Ежедневный посетитель', 'Зайдите 7 дней подряд', '🔥', 'security', 200, 50, 'epic', '{"type": "login_streak", "value": 7}'),
('weekly_regular', 'Недельный постоянный', 'Зайдите 30 дней подряд', '⚡', 'security', 500, 150, 'legendary', '{"type": "login_streak", "value": 30}'),

-- 🎯 SPECIAL EVENTS (Специальные события)
('birthday_shopper', 'Именинник', 'Совершите покупку в день рождения', '🎂', 'special', 300, 100, 'epic', '{"type": "birthday_purchase", "value": 1}'),
('new_year_shopper', 'Новогодний шопинг', 'Совершите покупку в декабре', '🎄', 'special', 150, 50, 'rare', '{"type": "december_purchase", "value": 1}'),
('summer_sale', 'Летний шопоголик', 'Совершите покупку летом', '☀️', 'special', 100, 25, 'uncommon', '{"type": "summer_purchase", "value": 1}'),

-- 🚀 MILESTONE ACHIEVEMENTS (Вехи)
('level_5', 'Продвинутый', 'Достигните 5 уровня', '⭐', 'milestone', 200, 50, 'rare', '{"type": "level_reached", "value": 5}'),
('level_10', 'Эксперт', 'Достигните 10 уровня', '🌟', 'milestone', 500, 150, 'epic', '{"type": "level_reached", "value": 10}'),
('level_25', 'Мастер', 'Достигните 25 уровня', '💫', 'milestone', 1000, 500, 'legendary', '{"type": "level_reached", "value": 25}'),
('achievement_hunter', 'Охотник за достижениями', 'Разблокируйте 10 достижений', '🏆', 'milestone', 300, 100, 'epic', '{"type": "achievements_unlocked", "value": 10}'),
('completionist', 'Перфекционист', 'Разблокируйте 50 достижений', '👑', 'milestone', 2000, 1000, 'legendary', '{"type": "achievements_unlocked", "value": 50}');

-- Verify insertions
SELECT COUNT(*) as total_achievements, 
       COUNT(DISTINCT category) as categories,
       SUM(xp_reward) as total_xp_available,
       SUM(coins_reward) as total_coins_available
FROM achievements;
