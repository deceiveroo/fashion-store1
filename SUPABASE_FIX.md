# Supabase Connection & Table Creation Fix

## Problems Identified

1. **SSL Certificate Issue**: The connection string had `sslmode=require` which conflicted with Node.js SSL settings
2. **Connection Pooler Timeout**: Drizzle-kit's `db:push` command hangs when using Supabase's pgbouncer (port 6543)
3. **Missing Tables**: Tables were never created in the database due to migration failures

## Fixes Applied

### 1. Updated `.env` File
- Removed `sslmode=require` from connection string
- Added `NODE_TLS_REJECT_UNAUTHORIZED=0` for development (allows self-signed certs)
- Added `pgbouncer=true` parameter for proper pooler handling

```env
DATABASE_URL="postgresql://postgres.mgprrbrevhzsvgizypov:12Botovo3d45-@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true"
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### 2. Fixed `drizzle.config.ts`
- Removed invalid `connectionTimeout` and `requestTimeout` properties
- Simplified configuration

### 3. Improved Database Connection (`lib/db.ts`)
- Added proper connection pool settings
- Added error handling for idle clients
- Set connection timeout to 5 seconds
- Disabled logger in production

## Current Status

✓ Database connection working
✓ 28 out of 29 tables created successfully
✗ Missing: `users` table

## To Complete Setup

### Option 1: Manual SQL (Recommended)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to SQL Editor
3. Run the SQL from `create-users-table.sql`:

```sql
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

CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role");
```

### Option 2: Use Migration Script

Run the migration script which handles connection resets:

```bash
node apply-migrations.js
```

Note: This may take several minutes as it executes each statement individually with retries.

## Testing Connection

To test if the connection is working:

```bash
node test-db-connection.js
```

This will show:
- Connection status
- List of existing tables
- Database query test

## Future Migrations

For future schema changes, use:

```bash
# Generate migration files
npm run db:generate

# Apply migrations (may hang with pgbouncer)
npm run db:push

# OR use the manual script (more reliable)
node apply-migrations.js
```

## Important Notes

1. **Development Only**: `NODE_TLS_REJECT_UNAUTHORIZED=0` should only be used in development
2. **Connection Pooler**: Supabase uses pgbouncer on port 6543, which can cause timeouts with long-running migrations
3. **Direct Connection**: For large migrations, consider using Supabase's direct connection (port 5432) if available
4. **SSL Warnings**: The SSL warnings are normal for Supabase development - they're switching to stricter SSL in future versions

## Troubleshooting

If you get "self-signed certificate" errors:
- Make sure `NODE_TLS_REJECT_UNAUTHORIZED=0` is set in `.env`
- Restart your terminal/IDE after changing `.env`

If migrations hang:
- Use `apply-migrations.js` script instead of `npm run db:push`
- The script handles connection resets automatically

If tables are missing:
- Check with `node test-db-connection.js`
- Manually create missing tables using SQL Editor in Supabase Dashboard
