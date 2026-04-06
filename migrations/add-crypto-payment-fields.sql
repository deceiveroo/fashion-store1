-- Migration: Add cryptocurrency payment fields to orders table

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS crypto_currency TEXT,
ADD COLUMN IF NOT EXISTS crypto_address TEXT,
ADD COLUMN IF NOT EXISTS crypto_tx_id TEXT,
ADD COLUMN IF NOT EXISTS crypto_amount DECIMAL(20, 8);

-- Add indexes for new columns if they don't exist
CREATE INDEX IF NOT EXISTS orders_crypto_currency_idx ON orders (crypto_currency);
CREATE INDEX IF NOT EXISTS orders_crypto_tx_id_idx ON orders (crypto_tx_id);