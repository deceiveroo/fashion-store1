# Next.js + Drizzle ORM + Supabase PostgreSQL Setup

This document outlines the setup for integrating Drizzle ORM with Supabase PostgreSQL in the Next.js fashion store application.

## Prerequisites

- Node.js >= 18.17 (required for Next.js 15)
- Access to a Supabase PostgreSQL database
- npm, yarn, pnpm, or bun package manager

## Installation

1. Install dependencies:

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit @types/node
```

2. Create a `.env` file in the root directory with your database credentials:

```env
DATABASE_URL="postgresql://postgres.mgprrbrevhzsvgizypov:12Botovo3d45-@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"
```

## Database Schema

The database schema is defined in `lib/schema.ts` using PostgreSQL-specific types from Drizzle ORM.

## Configuration

The Drizzle configuration is located in `drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

## Database Connection

The database connection is established in `lib/db.ts`:

```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Disable prefetch as it's not supported in Edge runtime
const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', prepare: false });
export const db = drizzle(client, { schema, logger: true });
```

## Running Migrations

To push your schema to the database:

```bash
npm run db:push
```

To generate migration files:

```bash
npm run db:generate
```

To run migrations:

```bash
npm run db:migrate
```

## Testing the Connection

A test API endpoint is available at `/api/test/db`. You can visit this endpoint to verify that your database connection is working properly.

## Example Schema Definition

Example user table definition in `lib/db/schema/users.ts`:

```ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the TypeScript type for the users table
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

## Security Notes

- Keep your database credentials secure and never commit them to version control
- The `.env` file is already in `.gitignore` to prevent accidental commits
- Use strong passwords and follow Supabase security best practices

## Troubleshooting

If you encounter issues:

1. Verify your database URL is correct
2. Check that your Supabase database is accessible
3. Ensure SSL settings are configured properly
4. Confirm that your schema files are correctly defined