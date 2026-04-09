# ✅ Profile Tables Migration - FIXED

## Problem Solved
Your Supabase database uses **UUID** for the `users.id` column, but the migration script was using **TEXT**. This caused the foreign key constraint error.

## ✅ What Was Fixed
- Changed all `id` columns from `TEXT` to `UUID`
- Changed all `user_id` foreign keys from `TEXT` to `UUID`
- Added `DEFAULT gen_random_uuid()` for automatic UUID generation
- Removed `IF NOT EXISTS` to ensure clean table creation

## 🚀 How to Apply Migration

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Copy and Paste
Copy the ENTIRE contents of `add-profile-tables.sql` and paste it into the SQL editor.

### Step 3: Run the Script
Click "Run" button. You should see:
```
Success. No rows returned
```

### Step 4: Verify Tables Created
The script automatically runs verification queries at the end. You should see:
```
table_name              | row_count
------------------------|----------
payment_methods         | 0
user_sessions          | 0
notification_settings  | 0
```

## 📋 What Tables Were Created

### 1. payment_methods
Stores user payment cards (only last 4 digits, no CVV stored)
- Supports cards and wallets
- Can set default payment method
- Automatically deletes when user is deleted

### 2. user_sessions
Tracks active login sessions for security
- Shows device, location, IP
- Can terminate sessions remotely
- Updates last_active automatically

### 3. notification_settings
User notification preferences
- Email, Push, SMS for 6 categories
- Orders, Promotions, Wishlist, Price Drops, Newsletter, Security
- Default settings created automatically

## 🧪 Test the APIs

After migration, test these endpoints:

```bash
# Get payment methods
GET /api/profile/payments

# Add a card
POST /api/profile/payments
{
  "cardNumber": "4111111111111111",
  "holderName": "John Doe",
  "expiryMonth": "12",
  "expiryYear": "2025",
  "cvv": "123",
  "isDefault": true
}

# Get sessions
GET /api/profile/sessions

# Get notifications
GET /api/profile/notifications
```

## ✅ Next Steps

1. Run the migration in Supabase ✅
2. Test adding a payment card in profile page
3. Check that sessions are being tracked
4. Verify notification settings load correctly
5. Test all profile features work end-to-end

## 🔧 If You Get Errors

### "relation already exists"
The script drops tables first, so this shouldn't happen. But if it does:
```sql
DROP TABLE IF EXISTS notification_settings CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
```

### "column does not exist"
Make sure you're running the ENTIRE script, not line by line.

### Foreign key errors
Make sure your `users` table exists and has UUID id column:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';
```

Should return: `id | uuid`

## 🎉 Success!
Once migration is complete, your profile page will have:
- ✅ Real payment cards (not fake data)
- ✅ Active session tracking
- ✅ Notification preferences
- ✅ Everything connected to real database
