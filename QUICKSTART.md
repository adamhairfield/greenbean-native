# Greenbean Quick Start Guide

Get your Greenbean app running in 10 minutes!

## Prerequisites

- Node.js 18+ installed
- Expo CLI: `npm install -g expo-cli`
- A Supabase account (free tier works)
- iOS Simulator (Mac) or Android Emulator

## Step 1: Install Dependencies (2 min)

```bash
cd Greenbean
yarn install
```

## Step 2: Set Up Supabase (5 min)

### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name it "Greenbean" and create

### Run Database Schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy ALL contents from `supabase/schema.sql`
4. Paste and click "Run"
5. Verify tables created in **Table Editor**

### Get Credentials
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**
   - **anon public key**

## Step 3: Configure App (1 min)

```bash
# Copy environment template
cp .env.example .env

# Edit .env and paste your Supabase credentials
# EXPO_PUBLIC_SUPABASE_URL=your_url_here
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

## Step 4: Add Sample Data (2 min)

In Supabase **SQL Editor**, run:

```sql
-- Add categories
INSERT INTO categories (name, description, display_order, is_active) VALUES
('Vegetables', 'Fresh seasonal vegetables', 1, true),
('Fruits', 'Locally grown fruits', 2, true),
('Dairy', 'Farm fresh dairy products', 3, true),
('Eggs', 'Free-range eggs', 4, true);

-- Add sample products
INSERT INTO products (category_id, name, description, price, unit, stock_quantity, is_available, farm_name, is_organic) VALUES
((SELECT id FROM categories WHERE name = 'Vegetables' LIMIT 1), 'Organic Tomatoes', 'Vine-ripened heirloom tomatoes', 4.99, 'lb', 50, true, 'Sunny Acres Farm', true),
((SELECT id FROM categories WHERE name = 'Vegetables' LIMIT 1), 'Fresh Lettuce', 'Crisp romaine lettuce', 3.49, 'head', 30, true, 'Green Valley Farm', true),
((SELECT id FROM categories WHERE name = 'Fruits' LIMIT 1), 'Apples', 'Crisp Honeycrisp apples', 3.99, 'lb', 100, true, 'Orchard Hills', false),
((SELECT id FROM categories WHERE name = 'Dairy' LIMIT 1), 'Whole Milk', 'Fresh whole milk', 5.99, 'gallon', 20, true, 'Happy Cow Dairy', false),
((SELECT id FROM categories WHERE name = 'Eggs' LIMIT 1), 'Free Range Eggs', 'Large brown eggs', 6.99, 'dozen', 40, true, 'Cluckin Good Farm', true);
```

## Step 5: Run the App! (30 sec)

```bash
yarn start
```

Then press:
- **i** for iOS Simulator
- **a** for Android Emulator
- **w** for Web Browser

## What You Can Do Now

### ✅ Working Features

1. **Sign Up / Sign In**
   - Create a new account
   - Sign in with email/password

2. **Browse Products**
   - View categories
   - See featured products
   - Pull to refresh

3. **Shopping Cart**
   - Cart badge shows item count
   - Navigate to cart screen

### 🚧 Coming Soon

- Product details
- Add to cart functionality
- Checkout process
- Order management
- Driver interface
- Admin dashboard

## Testing Different User Roles

### Make Yourself an Admin

1. Sign up through the app
2. Go to Supabase → **Authentication** → **Users**
3. Copy your user ID
4. Go to **Table Editor** → **profiles**
5. Find your row and change `role` to `admin` or `master`
6. Restart the app
7. You'll now see Admin and Driver tabs!

## Troubleshooting

### "Cannot connect to Supabase"
- Check your `.env` file has correct credentials
- Restart Expo dev server: `yarn start`

### "No products showing"
- Make sure you ran the sample data SQL
- Check **Table Editor** → **products** has data
- Pull to refresh in the app

### "TypeScript errors"
- These are cosmetic Supabase type issues
- They won't prevent the app from running
- Can be ignored for now

## Next Steps

1. **Explore the code**:
   - Check out `src/screens/shop/HomeScreen.tsx` for a working example
   - Look at `src/contexts/AuthContext.tsx` for auth logic
   - Review `supabase/schema.sql` for database structure

2. **Build more screens**:
   - Start with `ProductDetailScreen.tsx`
   - Then `CartScreen.tsx`
   - Follow the pattern in `HomeScreen.tsx`

3. **Read the docs**:
   - `README.md` - Full documentation
   - `SETUP.md` - Detailed setup guide
   - `PROJECT_SUMMARY.md` - What's built and what's next

## Get Help

- Check `SETUP.md` for detailed troubleshooting
- Review Supabase logs in dashboard
- Check Expo error messages in terminal

## Recommended Development Flow

1. Pick a screen to implement
2. Design the UI
3. Add Supabase queries
4. Test functionality
5. Move to next screen

Start with the shopping flow:
`HomeScreen` → `ProductDetailScreen` → `CartScreen` → `CheckoutScreen`

Happy coding! 🌱
