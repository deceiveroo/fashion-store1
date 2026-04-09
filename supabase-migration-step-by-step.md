# 🗄️ Supabase Migration - Пошаговая Инструкция

## Выполните каждую команду отдельно в Supabase SQL Editor

### Шаг 1: Payment Methods Table

```sql
CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
```

### Шаг 2: Payment Methods Index

```sql
CREATE INDEX IF NOT EXISTS payment_methods_user_idx ON payment_methods(user_id);
```

### Шаг 3: User Sessions Table

```sql
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device TEXT,
  location TEXT,
  ip TEXT,
  user_agent TEXT,
  last_active TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Шаг 4: User Sessions Indexes

```sql
CREATE INDEX IF NOT EXISTS user_sessions_user_idx ON user_sessions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_token_idx ON user_sessions(token);
```

### Шаг 5: Notification Settings Table

```sql
CREATE TABLE IF NOT EXISTS notification_settings (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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
```

### Шаг 6: Notification Settings Index

```sql
CREATE UNIQUE INDEX IF NOT EXISTS notification_settings_user_idx ON notification_settings(user_id);
```

### Шаг 7: Add Items Column to Orders (если нужно)

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB;
```

### Шаг 8: Проверка

```sql
-- Проверить что таблицы созданы
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('payment_methods', 'user_sessions', 'notification_settings');

-- Проверить колонку items в orders
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'items';
```

## ✅ Готово!

После выполнения всех шагов таблицы будут созданы и профиль заработает!
