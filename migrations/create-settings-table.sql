-- Migration: Create settings table and add maintenance mode settings
-- This creates the settings table if it doesn't exist and adds maintenance mode configuration

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
  ('maintenance_enable_subscription', 'true', 'Enable email subscription form on maintenance page'),
  ('maintenance_meme_image', '', 'Single meme image URL to display on maintenance page')
ON CONFLICT (key) DO NOTHING;
