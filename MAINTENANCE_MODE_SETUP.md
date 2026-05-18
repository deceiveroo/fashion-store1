# Инструкция по настройке Maintenance Mode

## ⚠️ ВАЖНО: Сначала выполните миграцию базы данных!

### Шаг 1: Выполнение SQL миграции

1. **Откройте Supabase Dashboard:**
   - Перейдите на https://app.supabase.com
   - Выберите ваш проект

2. **Перейдите в SQL Editor:**
   - В левой панели нажмите **SQL Editor**
   - Нажмите кнопку **New query**

3. **Выполните SQL код:**
   
   Скопируйте и вставьте следующий SQL код в редактор:

```sql
-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS settings_key_idx ON settings(key);

-- Insert default maintenance settings
INSERT INTO settings (key, value, description) VALUES
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
  ('maintenance_title', 'Сайт на обслуживании', 'Title shown on maintenance page'),
  ('maintenance_description', 'Мы проводим технические работы. Сайт скоро будет доступен.', 'Description shown on maintenance page'),
  ('maintenance_end_time', '', 'ISO date when maintenance ends (optional)'),
  ('maintenance_background_image', '', 'Background image URL for maintenance page'),
  ('maintenance_enable_subscription', 'true', 'Enable email subscription form on maintenance page')
ON CONFLICT (key) DO NOTHING;
```

4. **Нажмите "Run" (Ctrl+Enter)**

5. **Проверьте результат:**
   - Должно появиться сообщение "Success. No rows returned"
   - Если есть ошибки - проверьте что таблица ещё не существует

### Шаг 2: Создание таблицы подписок

Выполните второй SQL запрос:

```sql
-- Create maintenance subscriptions table
CREATE TABLE IF NOT EXISTS maintenance_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMP WITH TIME ZONE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_maintenance_subscriptions_email ON maintenance_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_maintenance_subscriptions_notified ON maintenance_subscriptions(notified);
```

### Шаг 3: Проверка работы

1. **Перезапустите dev сервер:**
   ```bash
   npm run dev
   ```

2. **Откройте админку:**
   - Перейдите на http://localhost:3000/admin/settings
   - Войдите как админ

3. **Найдите секцию "Режим обслуживания"** внизу страницы

4. **Включите режим:**
   - Переключите toggle "Включить режим обслуживания"
   - Настройте заголовок и описание
   - Нажмите "Сохранить настройки"

5. **Проверьте работу:**
   - Откройте новую вкладку в режиме инкогнито
   - Перейдите на http://localhost:3000
   - Вы должны увидеть красивую страницу-заглушку с анимацией

6. **Админы видят сайт нормально:**
   - Вернитесь в обычную вкладку где вы вошли как админ
   - Сайт должен работать без изменений

## 🎨 Возможности Maintenance Mode

### Что включено:

✅ **Красивая страница-заглушка** с анимированным градиентным фоном
✅ **Обратный отсчёт** (если указана дата окончания)
✅ **Форма подписки** на email уведомления
✅ **Адаптивный дизайн** для мобильных устройств
✅ **Glassmorphism эффекты** и современные анимации
✅ **SEO оптимизация** (meta robots noindex)

### Настройки в админке:

- **Toggle включения/выключения** режима
- **Заголовок страницы** (по умолчанию: "Сайт на обслуживании")
- **Описание** (текст для посетителей)
- **Дата окончания** (опционально, показывает таймер)
- **Фоновое изображение** (URL картинки)
- **Включение формы подписки** (сбор email'ов)

### API endpoints:

- `GET /api/maintenance/status` - публичный статус (без аутентификации)
- `GET /api/admin/maintenance` - получение настроек (только админ)
- `PUT /api/admin/maintenance` - обновление настроек (только админ)
- `POST /api/maintenance/subscribe` - подписка на уведомления

## 🔧 Технические детали

### Как это работает:

1. **Компонент `MaintenanceCheck`** в root layout проверяет статус при каждой загрузке
2. **Если режим включен** и пользователь не админ - показывается страница `/maintenance`
3. **Админы всегда видят сайт** независимо от статуса maintenance mode
4. **API роуты и статические файлы** доступны всегда
5. **Статус кэшируется** на клиенте для производительности

### Исключения (всегда доступны):

- `/admin/*` - все страницы админки
- `/api/*` - все API endpoints
- `/maintenance` - сама страница заглушки
- Статические файлы (CSS, JS, изображения)

## 📝 Примечания

- Email'ы подписчиков сохраняются в таблицу `maintenance_subscriptions`
- Можно просмотреть список подписчиков через SQL Editor в Supabase
- При выключении режима все посетители автоматически увидят обычный сайт
- Страница maintenance имеет HTTP статус 200 (не 503) чтобы избежать проблем с SEO
