# Greenbean Setup Guide

This guide will walk you through setting up the Greenbean app from scratch.

## Step 1: Supabase Setup

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: Greenbean
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
4. Click "Create new project"

### Set Up the Database

1. Wait for the project to finish setting up
2. Go to the **SQL Editor** tab
3. Click "New Query"
4. Copy the entire contents of `supabase/schema.sql`
5. Paste into the SQL editor
6. Click "Run" or press Cmd/Ctrl + Enter
7. Verify all tables were created in the **Table Editor**

### Get Your API Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)

### Configure Row Level Security (RLS)

The schema file already includes RLS policies, but verify:

1. Go to **Authentication** → **Policies**
2. Ensure all tables have policies enabled
3. Check that policies match your security requirements

## Step 2: Local Development Setup

### Install Dependencies

```bash
cd Greenbean
yarn install
```

### Configure Environment

1. Copy the example env file:
```bash
cp .env.example .env
```

2. Edit `.env` with your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Start Development Server

```bash
yarn start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser

## Step 3: Create Test Data

### Create Admin User

1. Sign up through the app
2. Go to Supabase Dashboard → **Authentication** → **Users**
3. Find your user and copy the UUID
4. Go to **Table Editor** → **profiles**
5. Find your profile row and change `role` from `customer` to `master`

### Add Sample Categories

Go to **Table Editor** → **categories** and add:

```sql
INSERT INTO categories (name, description, display_order, is_active) VALUES
('Vegetables', 'Fresh seasonal vegetables', 1, true),
('Fruits', 'Locally grown fruits', 2, true),
('Dairy', 'Farm fresh dairy products', 3, true),
('Meat & Poultry', 'Pasture-raised meats', 4, true),
('Eggs', 'Free-range eggs', 5, true),
('Baked Goods', 'Fresh baked items', 6, true),
('Preserves', 'Jams, jellies, and pickles', 7, true),
('Honey & Syrup', 'Local honey and maple syrup', 8, true);
```

### Add Sample Products

```sql
INSERT INTO products (category_id, name, description, price, unit, stock_quantity, is_available, farm_name, farm_location, is_organic) VALUES
-- Get category_id from the categories table for each product
((SELECT id FROM categories WHERE name = 'Vegetables' LIMIT 1), 'Organic Tomatoes', 'Vine-ripened heirloom tomatoes', 4.99, 'lb', 50, true, 'Sunny Acres Farm', 'Vermont', true),
((SELECT id FROM categories WHERE name = 'Vegetables' LIMIT 1), 'Fresh Lettuce', 'Crisp romaine lettuce', 3.49, 'head', 30, true, 'Green Valley Farm', 'Vermont', true),
((SELECT id FROM categories WHERE name = 'Fruits' LIMIT 1), 'Apples', 'Crisp Honeycrisp apples', 3.99, 'lb', 100, true, 'Orchard Hills', 'Vermont', false),
((SELECT id FROM categories WHERE name = 'Dairy' LIMIT 1), 'Whole Milk', 'Fresh whole milk', 5.99, 'gallon', 20, true, 'Happy Cow Dairy', 'Vermont', false),
((SELECT id FROM categories WHERE name = 'Eggs' LIMIT 1), 'Free Range Eggs', 'Large brown eggs', 6.99, 'dozen', 40, true, 'Cluckin Good Farm', 'Vermont', true);
```

### Create Delivery Schedules

```sql
INSERT INTO delivery_schedules (delivery_window, delivery_date, cutoff_date, max_orders, is_active) VALUES
('monday_wednesday', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '2 days', 100, true),
('thursday_saturday', CURRENT_DATE + INTERVAL '6 days', CURRENT_DATE + INTERVAL '5 days', 100, true);
```

## Step 4: Test the App

### Test Customer Flow

1. Sign up as a new user
2. Browse products
3. Add items to cart
4. Proceed to checkout
5. Place an order

### Test Driver Flow

1. Create a driver user (change role to `driver` in database)
2. Sign in as driver
3. View delivery list
4. Update order status

### Test Admin Flow

1. Sign in as admin/master user
2. Access admin dashboard
3. Add/edit products
4. View orders
5. Manage delivery schedules

## Step 5: Configure Storage (Optional)

For product images:

1. Go to **Storage** in Supabase Dashboard
2. Create a new bucket called `product-images`
3. Set it to **Public**
4. Add RLS policies:

```sql
-- Allow anyone to read product images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow admins to upload
CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('admin', 'master')
  )
);
```

## Step 6: Set Up Edge Functions (Optional)

### Install Supabase CLI

```bash
npm install -g supabase
```

### Initialize Supabase

```bash
supabase init
```

### Create Edge Functions

```bash
# Order processing
supabase functions new process-order

# Send notifications
supabase functions new send-notification

# Calculate delivery routes
supabase functions new optimize-routes
```

### Deploy Functions

```bash
supabase functions deploy process-order
```

## Step 7: Configure Authentication

### Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize:
   - Confirmation email
   - Password reset email
   - Magic link email

### Auth Providers (Optional)

Enable social login:
1. Go to **Authentication** → **Providers**
2. Enable and configure:
   - Google
   - Apple
   - Facebook

## Troubleshooting

### Common Issues

**"Invalid API key"**
- Check that your `.env` file has the correct credentials
- Restart the Expo dev server after changing `.env`

**"Row Level Security policy violation"**
- Check that RLS policies are correctly set up
- Verify user roles in the profiles table

**"Cannot connect to Supabase"**
- Check your internet connection
- Verify the Supabase project URL is correct
- Check Supabase project status

**TypeScript errors in contexts**
- These are related to Supabase type generation
- They won't prevent the app from running
- Can be fixed by generating types from your schema

### Generate TypeScript Types

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Generate types
supabase gen types typescript --linked > src/types/database.ts
```

## Next Steps

1. **Customize Branding**: Update colors, logo, and app name
2. **Add Payment**: Integrate Stripe or other payment processor
3. **Push Notifications**: Set up Expo notifications
4. **Analytics**: Add analytics tracking
5. **Testing**: Write unit and integration tests
6. **Deploy**: Build and submit to app stores

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Supabase logs in the dashboard
3. Check Expo error messages
4. Create an issue on GitHub
