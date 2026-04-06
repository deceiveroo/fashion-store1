# Admin Panel Setup Guide

## Overview

A complete admin panel has been created for your fashion store with the following features:

- **Dashboard** - Real-time statistics and overview
- **Products Management** - Create, edit, delete products with images
- **Orders Management** - View and update order statuses
- **Users Management** - Manage user roles and accounts
- **Categories Management** - Organize product categories
- **Analytics** - Detailed statistics and insights

## Database Connection Fix

### Step 1: Get Your Supabase DATABASE_URL

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings** → **Database**
4. Find the **Connection string** section
5. Copy the **URI** connection string (NOT the pooler version)

The URL should look like this:
```
postgresql://postgres.[project-id]:[password]@db.[region].supabase.co:5432/postgres
```

**IMPORTANT:** Do NOT use the pooler URL (port 6543). Use the direct connection (port 5432).

### Step 2: Update Environment Variables

Open the `.env` file in the project root and update the `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres.mgprrbrevhzsvgizypov:YOUR_PASSWORD@db.aws-1-eu-west-3.supabase.co:5432/postgres"
NODE_TLS_REJECT_UNAUTHORIZED=0
JWT_SECRET="super-secret-jwt-key-for-fashion-store-2026"
NEXTAUTH_SECRET="super-secret-jwt-key-for-fashion-store-2026"
```

Replace `YOUR_PASSWORD` with your actual Supabase database password.

### Step 3: Verify Connection

Test the database connection:

```bash
npx cross-env NODE_TLS_REJECT_UNAUTHORIZED=0 dotenv -e .env -- tsx ./check-products.ts
```

If successful, you should see:
```
Products found: 0
No products in database
```

## Seeding the Database

### Run the Seed Script

Once the database connection is working, run:

```bash
npm run seed
```

Or manually:

```bash
npx cross-env NODE_TLS_REJECT_UNAUTHORIZED=0 dotenv -e .env -- tsx ./lib/seed.ts
```

This will create:

**Categories:**
- Мужское (Men)
- Женское (Women)
- Обувь (Shoes)
- Верхняя одежда (Outerwear)
- Новинки (New)
- Коллекции (Collections)

**Users:**
- Admin: `admin@example.com` / password: `admin`
- User: `user@example.com` / password: `user123`

**Products:**
- 180 sample products with:
  - Random prices (1000-11000 rubles)
  - Product images (placeholders)
  - Category assignments
  - Stock status
  - Featured items

The seed script inserts products one by one to avoid connection issues with Supabase. This may take 2-3 minutes.

## Running the Application

### Start Development Server

```bash
npm run dev
```

The application will be available at: http://localhost:3000

### Access Admin Panel

1. Navigate to: http://localhost:3000/admin
2. Login with admin credentials:
   - Email: `admin@example.com`
   - Password: `admin`

## Admin Panel Features

### Dashboard (`/admin`)
- View total users, products, orders, and revenue
- See recent orders with status badges
- Quick access to product management
- Search and filter products

### Products (`/admin/products`)
- **Create**: Add new products with images, categories, pricing
- **Edit**: Update product details, images, stock status
- **Delete**: Remove products from the store
- **Search**: Find products by name
- Upload images via URL or file upload

### Orders (`/admin/orders`)
- View all customer orders
- Filter by status (pending, processing, shipped, delivered, cancelled)
- Update order status with dropdown
- View order details in modal
- Search by order ID or customer email

### Users (`/admin/users`)
- List all registered users
- Change user roles (user, moderator, admin)
- Delete user accounts
- Filter by role
- Search by email or name

### Categories (`/admin/categories`)
- Create new categories with parent-child relationships
- Edit existing categories
- Set featured categories
- Delete categories
- Manage category hierarchy

### Analytics (`/admin/analytics`)
- Revenue statistics
- Order metrics
- User conversion rates
- Popular products ranking
- Orders by status breakdown
- Users by role distribution

## Troubleshooting

### Connection Error: "SASL: SCRAM-SERVER-FIRST-MESSAGE"

**Problem:** Invalid database credentials or wrong URL format.

**Solution:**
1. Verify your Supabase password is correct
2. Ensure you're using the direct connection URL (port 5432), not pooler (port 6543)
3. Check that special characters in password are properly encoded

### Connection Error: "Connection terminated unexpectedly"

**Problem:** Network issues or Supabase blocking connections.

**Solution:**
1. Check your internet connection
2. Verify Supabase project is active
3. Ensure your IP is not blocked in Supabase settings
4. Try increasing connection timeout in `lib/db.ts`

### Seed Script Fails Midway

**Problem:** Large batch inserts failing.

**Solution:**
The seed script now inserts products one by one. If it still fails:
1. Check Supabase query logs in dashboard
2. Verify table schema matches the seed data
3. Run `npm run db:push` to ensure schema is up to date

### Admin Login Not Working

**Problem:** Cannot login as admin.

**Solution:**
1. Ensure seed script completed successfully
2. Check that user has `role: 'admin'` in database
3. Clear browser cache and cookies
4. Try registering a new user and manually setting role to 'admin' in database

## API Endpoints

The admin panel uses these API routes:

- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List users
- `PUT /api/admin/users` - Update user
- `DELETE /api/admin/users` - Delete user
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product
- `GET /api/orders` - List orders
- `PUT /api/orders/[id]` - Update order status
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

## File Structure

```
app/admin/
├── layout.tsx              # Admin layout with sidebar
├── page.tsx                # Main dashboard
├── products/
│   ├── new/page.tsx        # Create product form
│   └── [id]/page.tsx       # Edit product form
├── orders/page.tsx         # Orders management
├── users/page.tsx          # Users management
├── categories/page.tsx     # Categories management
└── analytics/page.tsx      # Analytics dashboard

app/api/
├── admin/
│   ├── stats/route.ts
│   └── users/route.ts
├── products/
│   ├── route.ts
│   └── [id]/route.ts
├── orders/
│   ├── route.ts
│   └── [id]/route.ts
└── categories/
    ├── route.ts
    └── [id]/route.ts
```

## Security Notes

- Admin routes check user role before rendering
- API endpoints verify authentication
- Never commit `.env` file with real credentials
- Change default admin password after first login
- Use strong passwords in production
- Enable HTTPS in production environment

## Support

For issues or questions:
1. Check Supabase dashboard logs
2. Review browser console for errors
3. Verify environment variables are set correctly
4. Ensure all dependencies are installed: `npm install`
