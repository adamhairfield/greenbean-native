# Supabase Edge Functions

These Edge Functions handle Stripe operations securely on the backend.

## Setup

1. **Set Stripe Secret Keys**
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase secrets set APP_URL=https://your-app-url.com
   ```

2. **Deploy Functions**
   ```bash
   # Deploy all functions
   supabase functions deploy

   # Or deploy individually
   supabase functions deploy create-payment-intent
   supabase functions deploy create-connect-account
   ```

## Available Functions

### create-payment-intent
Creates a Stripe payment intent for an order with automatic seller splits.

**Endpoint:** `POST /functions/v1/create-payment-intent`

**Body:**
```json
{
  "order_id": "uuid",
  "amount": 100.50,
  "currency": "usd"
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### create-connect-account
Creates a Stripe Connect account for a seller and returns onboarding URL.

**Endpoint:** `POST /functions/v1/create-connect-account`

**Body:**
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

## Testing Locally

```bash
# Start local Edge Functions
supabase functions serve

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/create-payment-intent' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"order_id":"xxx","amount":100}'
```

## Environment Variables

Set these in Supabase Dashboard > Project Settings > Edge Functions:

- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `APP_URL` - Your app's URL for redirects

## TypeScript Errors

The TypeScript errors you see in your IDE are expected - these functions run in Deno, not Node.js. They will work correctly when deployed to Supabase.
