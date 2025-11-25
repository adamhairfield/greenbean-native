import { StripeProvider } from '@stripe/stripe-react-native';

// Get the publishable key from environment variables
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Validate that the key is set
if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn('Stripe publishable key is not set. Please add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env file');
}

// Export the provider for use in App.tsx
export { StripeProvider };

// Stripe configuration
export const stripeConfig = {
  publishableKey: STRIPE_PUBLISHABLE_KEY,
  merchantIdentifier: 'merchant.com.greenbean', // For Apple Pay
  urlScheme: 'greenbean', // For redirects
};
