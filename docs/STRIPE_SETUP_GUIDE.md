# Stripe Setup Guide

## ✅ Completed Steps

1. ✅ Installed Stripe packages
2. ✅ Created database schema for sellers
3. ✅ Created Stripe service layer
4. ✅ Created Edge Functions for backend operations
5. ✅ Set up environment variables template

## Next Steps

### 1. Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or sign in
3. Navigate to **Developers > API Keys**
4. Copy your **Publishable key** and **Secret key** (use test keys for development)
5. Navigate to **Connect > Settings**
6. Copy your **Connect client ID**

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy from .env.example
cp .env.example .env
```

Add your Stripe keys:

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CONNECT_CLIENT_ID=ca_...
```

### 3. Set Supabase Secrets

```bash
# Set Stripe secret key for Edge Functions
supabase secrets set STRIPE_SECRET_KEY=sk_test_...

# Set your app URL for redirects
supabase secrets set APP_URL=exp://localhost:8081  # For development
```

### 4. Deploy Edge Functions

```bash
# Deploy all Stripe functions
supabase functions deploy create-payment-intent
supabase functions deploy create-connect-account
```

### 5. Configure Stripe Webhooks (Production)

1. Go to **Developers > Webhooks** in Stripe Dashboard
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `transfer.created`
4. Copy the webhook signing secret
5. Set it in Supabase: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`

### 6. Update App.tsx with Stripe Provider

Add the Stripe provider to your app:

```tsx
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from './src/lib/stripe';

export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      {/* Your app components */}
    </StripeProvider>
  );
}
```

### 7. Test Payment Flow

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

## Architecture Overview

### Payment Flow
1. Customer adds items to cart
2. Customer proceeds to checkout
3. App calls `create-payment-intent` Edge Function
4. Edge Function:
   - Calculates seller splits
   - Creates Stripe PaymentIntent
   - Stores transfer data in order
5. Customer completes payment in app
6. Webhook confirms payment
7. Platform creates transfers to sellers

### Seller Onboarding Flow
1. User signs up as seller
2. App calls `create-connect-account` Edge Function
3. Edge Function:
   - Creates Stripe Connect account
   - Generates onboarding link
   - Stores account ID in database
4. Seller completes Stripe onboarding
5. Webhook updates seller status
6. Seller can now create products

## Fee Structure

- **Platform Fee**: 10% of product sales (configurable per seller)
- **Delivery Fee**: $5.00 (100% to platform)
- **Tax**: 8% (collected by platform)

### Example Order Calculation

Product subtotal: $100.00
- Seller receives: $90.00 (90%)
- Platform keeps: $10.00 (10%)

Delivery fee: $5.00 (100% to platform)
Tax: $8.00 (8% of subtotal)

**Total charged to customer**: $113.00
**Seller receives**: $90.00
**Platform receives**: $23.00 ($10 fee + $5 delivery + $8 tax)

## Security Notes

- ✅ Never expose secret keys in client code
- ✅ All Stripe operations happen in Edge Functions
- ✅ RLS policies protect seller data
- ✅ Webhook signatures verified
- ✅ User authentication required for all operations

## Testing Checklist

- [ ] Create seller account
- [ ] Complete Stripe onboarding
- [ ] Create product as seller
- [ ] Place order with seller product
- [ ] Complete payment
- [ ] Verify seller receives transfer
- [ ] Test refund flow
- [ ] Test multi-seller order

## Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Configure production webhooks
- [ ] Set production APP_URL
- [ ] Test with real bank account
- [ ] Configure payout schedule
- [ ] Set up monitoring/alerts
- [ ] Test dispute handling
- [ ] Configure tax collection
- [ ] Set up customer support flow

## Resources

- [Stripe React Native Docs](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)
- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
