-- Run this SQL in your Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text,
  "email" text NOT NULL,
  "password" text,
  "email_verified" timestamp,
  "image" text,
  "role" text DEFAULT 'user',
  "two_factor_secret" text,
  "last_edited_at" timestamp,
  "affinity_scores" jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role");
