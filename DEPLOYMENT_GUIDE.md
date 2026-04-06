# Fashion Store Deployment Guide

## Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Turso CLI (optional, for local development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Environment Variables
Create a `.env.local` file in the root directory:

```env
DATABASE_URL="file:./dev.db"  # For SQLite local file
# OR for Turso:
LIBSQL_DATABASE_URL="libsql://your-database.turso.io"
LIBSQL_DATABASE_AUTH_TOKEN="your-auth-token"
```

### 3. Start Local Turso Server (Alternative to Cloud)
If you prefer to run a local Turso-compatible server:

```bash
npx @libsql/server --db-file ./local.db
```

Then set your environment to:
```env
LIBSQL_DATABASE_URL="http://127.0.0.1:8080"
# No auth token needed for local server
```

### 4. Generate and Apply Database Schema
```bash
# If using Drizzle Kit
npx drizzle-kit generate
npx drizzle-kit push
```

### 5. Run the Application
```bash
npm run dev
```

## Running Integrity Tests

### 1. Run the Integrity Test Suite
```bash
npm run test:integrity
```

If this script doesn't exist yet, add it to your `package.json`:

```json
{
  "scripts": {
    "test:integrity": "npx vitest integrity.test.ts"
  }
}
```

### 2. Example Integrity Test (integrity.test.ts)
```typescript
import { expect, test, describe } from 'vitest';
import { db } from './lib/db';
import { products, categories, productCategoryLinks } from './lib/db/schema';

describe('Database Integrity Tests', () => {
  test('foreign key constraints work properly', async () => {
    // Test that we cannot attach a product to a non-existent category
    const fakeCategoryId = 'non-existent-category';
    const fakeProductId = 'non-existent-product';
    
    await expect(async () => {
      await db.insert(productCategoryLinks).values({
        id: 'test-id',
        productId: fakeProductId,
        categoryId: fakeCategoryId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }).rejects.toThrow(); // Should throw due to foreign key constraint
    
    // Verify no invalid links exist
    const invalidLinks = await db
      .select()
      .from(productCategoryLinks)
      .where(/* conditions for invalid links */);
      
    expect(invalidLinks).toHaveLength(0);
  });

  test('PRAGMA foreign_key_check passes', async () => {
    // Note: This is SQLite-specific
    // In a real test you would run PRAGMA foreign_key_check
    // and verify all returned rows are empty
  });
});
```

### 3. Additional Test Scenarios
```typescript
test('deleting 10% of products still maintains referential integrity', async () => {
  // Implementation to test what happens when products are deleted
  // and how it affects orders, links, etc.
});
```

## Production Deployment

### Deploy to Vercel
```bash
# Using Vercel CLI
vercel --prod
```

### Database Setup for Production
1. Create a Turso database:
```bash
turso db create fashion-store-prod
```

2. Update your production environment variables:
```env
LIBSQL_DATABASE_URL="libsql://your-prod-database.turso.io"
LIBSQL_DATABASE_AUTH_TOKEN="your-prod-auth-token"
```

3. Apply schema to production:
```bash
npx drizzle-kit push --env=production
```

## Multi-level Caching Strategy

### 1. Static Data (Categories, Config) - Next.js Cache
```typescript
import { cache } from 'react';
import { db } from './lib/db';
import { categories } from './lib/db/schema';

export const getCachedCategories = cache(async () => {
  const cats = await db.select().from(categories);
  return cats;
});
```

### 2. User Data (Cart) - SWR + LocalStorage
```typescript
// In components
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const { data: cart } = useSWR('/api/cart', fetcher);
```

### 3. Cache Invalidation
After any server action that modifies data, invalidate related paths:
```typescript
import { revalidatePath } from 'next/cache';

// In server action
revalidatePath('/products');
revalidatePath(`/categories/${categoryId}`);
```

## Key Features Implemented

### 1. Link Contracts
- Every relationship is a contract with validation
- Time windows (validFrom/validTo)
- Audit trail (linkEvents)
- Soft deletes for historical data

### 2. Advanced Features
- "Frequently bought together" (productRecommendations table)
- "Product timeline" (linkEvents for tracking changes)
- "Smart cart" (suggestions based on productAttributeValues)
- "User affinity scores" (in user affinityScores field)
- Offline cart sync (with localStorage and syncCart action)

### 3. Admin Protection
- Required reasons for changes
- Preview functionality
- Conflict detection (lastEditedAt)
- 2FA ready (twoFactorSecret field)

### 4. Design System
- Design tokens in [design-tokens.ts](./app/config/design-tokens.ts)
- Theme configuration (minimal, luxury, eco)
- Consistent styling via Tailwind config