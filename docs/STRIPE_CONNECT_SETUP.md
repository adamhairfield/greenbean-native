# Stripe Connect Setup for Greenbean Marketplace

## Overview
Greenbean uses Stripe Connect to enable sellers to receive payments while the platform collects fees. This document outlines the setup and implementation.

## Architecture

### Payment Flow
1. **Customer** places order with products from one or more sellers
2. **Platform** (Greenbean) charges customer's card
3. **Platform** automatically splits payment:
   - Seller receives: `product_price * (1 - platform_fee_percentage/100)`
   - Platform keeps: `product_price * (platform_fee_percentage/100) + delivery_fee`

### Default Fee Structure
- **Platform Fee**: 10% of product sales
- **Delivery Fee**: 100% goes to platform (default $5.00)
- **Tax**: Collected by platform (8%)

## Database Schema

### Sellers Table
```sql
CREATE TABLE sellers (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) UNIQUE,
    business_name TEXT NOT NULL,
    business_description TEXT,
    business_address TEXT,
    business_phone TEXT,
    business_email TEXT,
    
    -- Stripe Connect
    stripe_account_id TEXT UNIQUE,
    stripe_account_status TEXT DEFAULT 'pending',
    stripe_onboarding_completed BOOLEAN DEFAULT false,
    stripe_charges_enabled BOOLEAN DEFAULT false,
    stripe_payouts_enabled BOOLEAN DEFAULT false,
    
    -- Fee Configuration
    platform_fee_percentage DECIMAL(5, 2) DEFAULT 10.00,
    delivery_fee_percentage DECIMAL(5, 2) DEFAULT 100.00,
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);
```

### Products Table Update
- Added `seller_id` column to link products to sellers
- Sellers can only manage their own products via RLS policies

## Stripe Connect Implementation Steps

### 1. Stripe Account Setup
```bash
# Install Stripe SDK
npm install stripe @stripe/stripe-react-native

# Set environment variables
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_CONNECT_CLIENT_ID=ca_...
```

### 2. Backend API Endpoints Needed

#### Create Connected Account
```typescript
POST /api/stripe/create-connect-account
Body: {
  user_id: string,
  business_name: string,
  business_email: string,
  business_phone?: string
}
Response: {
  account_id: string,
  onboarding_url: string
}
```

#### Check Account Status
```typescript
GET /api/stripe/account-status/:account_id
Response: {
  charges_enabled: boolean,
  payouts_enabled: boolean,
  details_submitted: boolean,
  requirements: {
    currently_due: string[],
    eventually_due: string[],
    past_due: string[]
  }
}
```

#### Create Payment Intent with Transfer
```typescript
POST /api/stripe/create-payment-intent
Body: {
  order_id: string,
  amount: number,
  seller_transfers: [{
    seller_id: string,
    stripe_account_id: string,
    amount: number
  }]
}
```

### 3. Seller Onboarding Flow

1. **Seller Registration**
   - User signs up with role='seller'
   - Creates seller profile with business info
   
2. **Stripe Connect Onboarding**
   - Platform creates Stripe Connect account
   - Seller completes Stripe onboarding form
   - Stripe verifies identity and bank account
   
3. **Account Activation**
   - Update `stripe_onboarding_completed = true`
   - Update `stripe_charges_enabled` and `stripe_payouts_enabled`
   - Set `is_verified = true` after admin approval

4. **Product Creation**
   - Seller can now create products
   - Products linked to seller via `seller_id`

### 4. Payment Processing

#### Order Creation
```typescript
// Calculate totals for multi-seller order
const orderItems = [
  { product_id, seller_id, price, quantity },
  // ...
];

// Group by seller
const sellerTotals = groupBySeller(orderItems);

// Calculate platform fees
const transfers = sellerTotals.map(seller => ({
  seller_id: seller.id,
  stripe_account_id: seller.stripe_account_id,
  amount: seller.subtotal * (1 - seller.platform_fee_percentage / 100)
}));

// Create payment intent with automatic transfers
const paymentIntent = await stripe.paymentIntents.create({
  amount: orderTotal,
  currency: 'usd',
  transfer_group: order_id,
  metadata: { order_id }
});

// Create transfers to sellers
for (const transfer of transfers) {
  await stripe.transfers.create({
    amount: transfer.amount,
    currency: 'usd',
    destination: transfer.stripe_account_id,
    transfer_group: order_id
  });
}
```

### 5. Seller Dashboard Features

- **Revenue Tracking**: View total, pending, and paid revenue
- **Product Management**: Create, edit, delete products
- **Order History**: View orders containing their products
- **Payout Schedule**: See upcoming and past payouts
- **Account Status**: Monitor Stripe account health

### 6. Admin Features

- **Seller Approval**: Verify and activate seller accounts
- **Fee Management**: Adjust platform fees per seller
- **Seller Analytics**: Monitor seller performance
- **Dispute Resolution**: Handle customer/seller issues

## Security Considerations

1. **RLS Policies**: Sellers can only access their own data
2. **Stripe Webhooks**: Verify webhook signatures
3. **Account Verification**: Require admin approval before activation
4. **Fee Validation**: Validate fees on backend, not client
5. **Payout Protection**: Hold funds for dispute period

## Testing

### Test Mode
- Use Stripe test mode for development
- Test cards: `4242 4242 4242 4242`
- Test bank accounts provided by Stripe

### Test Scenarios
1. Single seller order
2. Multi-seller order
3. Refund handling
4. Failed payment
5. Seller account restrictions

## Production Checklist

- [ ] Switch to Stripe live keys
- [ ] Configure webhook endpoints
- [ ] Set up payout schedules
- [ ] Configure tax collection
- [ ] Set up fraud detection
- [ ] Configure email notifications
- [ ] Set up customer support flow
- [ ] Test refund process
- [ ] Configure dispute handling
- [ ] Set up financial reporting

## Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Connect Onboarding](https://stripe.com/docs/connect/onboarding)
- [Stripe Transfers](https://stripe.com/docs/connect/charges-transfers)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
