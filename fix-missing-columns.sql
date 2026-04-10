-- Fix 1: Add missing columns to support_chat_sessions
-- Run this in Supabase SQL Editor

ALTER TABLE support_chat_sessions
  ADD COLUMN IF NOT EXISTS operator_rating integer,
  ADD COLUMN IF NOT EXISTS operator_rated_at timestamptz,
  ADD COLUMN IF NOT EXISTS operator_rated_by text;
