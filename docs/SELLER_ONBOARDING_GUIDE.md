# Seller Onboarding Guide

## Complete Seller Onboarding Flow

### User Journey

1. **Customer discovers selling opportunity**
   - Sees "Become a Seller" button on Profile screen
   - Only visible to customers (not sellers, admins, or masters)

2. **Seller Registration** (`BecomeSellerScreen`)
   - User fills out business information:
     - Business Name *
     - Business Email *
     - Business Phone
     - Business Address
     - Business Description
   - Views platform fee information (10%)
   - Submits to create seller account

3. **Account Creation Process**
   - User role updated to `'seller'`
   - Seller profile created in database
   - Stripe Connect account created (via Edge Function)
   - User redirected to onboarding status

4. **Stripe Connect Onboarding** (`SellerOnboardingStatusScreen`)
   - User completes Stripe identity verification
   - Adds bank account for payouts
   - Completes required business information
   - Stripe verifies identity and business details

5. **Admin Verification**
   - Admin reviews seller application
   - Sets `is_verified = true` in database
   - Seller receives notification

6. **Start Selling**
   - Seller tab appears in bottom navigation
   - Access to seller dashboard
   - Can create and manage products
   - Receives payments automatically

## Screens Created

### 1. BecomeSellerScreen
**Location:** `/src/screens/seller/BecomeSellerScreen.tsx`

**Features:**
- Business information form
- Platform benefits display
- Fee structure information
- Creates seller profile
- Initiates Stripe Connect

**Navigation:** `Account → BecomeSeller`

### 2. SellerOnboardingStatusScreen
**Location:** `/src/screens/seller/SellerOnboardingStatusScreen.tsx`

**Features:**
- Real-time onboarding status
- Setup checklist:
  - ✓ Stripe account created
  - ✓ Stripe onboarding completed
  - ✓ Payments enabled
  - ✓ Payouts enabled
  - ✓ Admin verified
- Continue onboarding button
- Business information display
- Help/support section

**Navigation:** `Account → SellerOnboardingStatus`

### 3. Updated ProfileScreen
**Features Added:**
- "Become a Seller" button for customers
- Conditional display based on user role
- Navigation to seller onboarding

## Database Flow

### Seller Creation
```sql
-- 1. Update user role
UPDATE profiles 
SET role = 'seller' 
WHERE id = [user_id];

-- 2. Create seller profile
INSERT INTO sellers (
  user_id,
  business_name,
  business_email,
  business_phone,
  business_address,
  business_description
) VALUES (...);

-- 3. Stripe account created via Edge Function
-- stripe_account_id stored in sellers table
```

### Onboarding Status Checks
```sql
SELECT 
  stripe_account_id,
  stripe_onboarding_completed,
  stripe_charges_enabled,
  stripe_payouts_enabled,
  is_verified,
  is_active
FROM sellers
WHERE user_id = [user_id];
```

## Stripe Connect Integration

### Edge Function: create-connect-account
**Endpoint:** `POST /functions/v1/create-connect-account`

**Request:**
```json
{
  "user_id": "uuid",
  "business_name": "Farm Name",
  "business_email": "seller@example.com",
  "business_phone": "+1234567890",
  "business_address": "123 Farm Rd"
}
```

**Response:**
```json
{
  "accountId": "acct_xxx",
  "onboardingUrl": "https://connect.stripe.com/..."
}
```

**Process:**
1. Creates Stripe Express account
2. Generates onboarding link
3. Stores account ID in database
4. Returns URL for user to complete onboarding

### Onboarding Link Refresh
**Function:** `refreshOnboardingLink(accountId)`

Used when:
- User needs to continue incomplete onboarding
- Onboarding link expired
- User wants to update information

## Admin Approval Process

### Admin Dashboard (To Be Built)
Admins can:
1. View pending seller applications
2. Review business information
3. Verify Stripe account status
4. Approve or reject sellers
5. Set platform fee percentage per seller

### Approval SQL
```sql
UPDATE sellers
SET is_verified = true,
    is_active = true
WHERE id = [seller_id];
```

## Testing the Flow

### Manual Testing (Without Stripe)
1. Create user account
2. Navigate to Profile → Become a Seller
3. Fill out business information
4. Submit (Stripe will fail gracefully)
5. Manually update database:
```sql
UPDATE sellers
SET stripe_onboarding_completed = true,
    stripe_charges_enabled = true,
    stripe_payouts_enabled = true,
    is_verified = true
WHERE user_id = [your_user_id];
```
6. Refresh app - Seller tab should appear
7. Access seller dashboard and create products

### Full Testing (With Stripe)
1. Set up Stripe test keys
2. Deploy Edge Functions
3. Complete full onboarding flow
4. Use Stripe test data for verification
5. Test product creation and sales

## Security & Validation

### RLS Policies
- Sellers can only view/edit their own profile
- Sellers can only manage their own products
- Admins can view/manage all sellers

### Validation
- Business name required
- Business email required and validated
- User can only create one seller account
- Stripe account creation handled securely server-side

## Fee Structure

**Default Fees:**
- Platform Fee: 10% of product sales
- Delivery Fee: 100% to platform ($5.00)
- Tax: 8% collected by platform

**Customizable:**
- Admins can adjust `platform_fee_percentage` per seller
- Admins can adjust `delivery_fee_percentage` per seller

## Next Steps

1. **Deploy Edge Functions**
   ```bash
   supabase functions deploy create-connect-account
   ```

2. **Set Stripe Secrets**
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase secrets set APP_URL=https://your-app.com
   ```

3. **Configure Stripe Webhooks**
   - Set up webhook for account updates
   - Update seller status when Stripe onboarding completes

4. **Build Admin Approval Interface**
   - Seller application review screen
   - Bulk approval actions
   - Seller analytics

5. **Add Notifications**
   - Email when seller approved
   - Push notification for status updates
   - Stripe onboarding reminders

## Troubleshooting

### Seller Tab Not Appearing
- Check user role is 'seller'
- Verify seller record exists
- Check `is_verified = true`
- Restart app to refresh auth context

### Stripe Onboarding Fails
- Verify Edge Function deployed
- Check Stripe secret keys set
- Verify redirect URLs configured
- Check Stripe dashboard for errors

### Can't Create Products
- Verify seller account exists
- Check `is_verified = true`
- Verify RLS policies applied
- Check seller_id in products table

## Resources

- [Stripe Connect Onboarding](https://stripe.com/docs/connect/onboarding)
- [Stripe Express Accounts](https://stripe.com/docs/connect/express-accounts)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
