import { supabase } from '../lib/supabase';

/**
 * Stripe Service
 * Handles all Stripe-related operations including payments and Connect accounts
 * 
 * Note: Most Stripe operations require backend API endpoints for security.
 * These functions call Supabase Edge Functions that interact with Stripe.
 */

export interface CreatePaymentIntentParams {
  orderId: string;
  amount: number;
  currency?: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface CreateConnectAccountParams {
  userId: string;
  businessName: string;
  businessEmail: string;
  businessPhone?: string;
  businessAddress?: string;
}

export interface CreateConnectAccountResponse {
  accountId: string;
  onboardingUrl: string;
}

export interface StripeAccountStatus {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements?: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
  };
}

/**
 * Create a payment intent for an order
 * This calls a Supabase Edge Function that creates the Stripe payment intent
 */
export const createPaymentIntent = async (
  params: CreatePaymentIntentParams
): Promise<CreatePaymentIntentResponse> => {
  try {
    // Get the current session to ensure we have an auth token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    console.log('Creating payment intent with auth token');

    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        order_id: params.orderId,
        amount: params.amount,
        currency: params.currency || 'usd',
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }
    
    if (data?.error) {
      console.error('Payment intent error:', data.error, data.details);
      throw new Error(data.error);
    }
    
    return data;
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    throw new Error(error.message || 'Failed to create payment intent');
  }
};

/**
 * Create a Stripe Connect account for a seller
 * This calls a Supabase Edge Function that creates the Connect account
 */
export const createConnectAccount = async (
  params: CreateConnectAccountParams
): Promise<CreateConnectAccountResponse> => {
  try {
    // Get the current session to ensure we have an auth token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    console.log('Calling Edge Function with auth token:', session.access_token ? 'Present' : 'Missing');

    // Use fetch directly to ensure headers are passed correctly
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/create-connect-account`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        user_id: params.userId,
        business_name: params.businessName,
        business_email: params.businessEmail,
        business_phone: params.businessPhone,
        business_address: params.businessAddress,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Edge Function error response:', errorData);
      throw new Error(errorData.message || 'Edge Function failed');
    }

    const data = await response.json();
    
    console.log('Connect account created:', data);
    return data;
  } catch (error: any) {
    console.error('Error creating Connect account:', error);
    throw new Error(error?.message || 'Failed to create Stripe Connect account');
  }
};

/**
 * Get the status of a Stripe Connect account
 */
export const getAccountStatus = async (
  accountId: string
): Promise<StripeAccountStatus> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-account-status', {
      body: { account_id: accountId },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting account status:', error);
    throw new Error('Failed to get account status');
  }
};

/**
 * Refresh the onboarding link for a Connect account
 */
export const refreshOnboardingLink = async (
  accountId: string
): Promise<{ url: string }> => {
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Use fetch directly to ensure headers are passed correctly
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/refresh-onboarding-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({ account_id: accountId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Edge Function error response:', errorData);
      throw new Error(errorData.message || 'Edge Function failed');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error refreshing onboarding link:', error);
    throw new Error(error?.message || 'Failed to refresh onboarding link');
  }
};

/**
 * Calculate platform fees for an order
 */
export const calculatePlatformFees = (
  subtotal: number,
  platformFeePercentage: number = 18
): { platformFee: number; sellerAmount: number } => {
  const platformFee = subtotal * (platformFeePercentage / 100);
  const sellerAmount = subtotal - platformFee;
  
  return {
    platformFee: Math.round(platformFee * 100) / 100, // Round to 2 decimals
    sellerAmount: Math.round(sellerAmount * 100) / 100,
  };
};

/**
 * Calculate total order amount including fees and tax
 */
export const calculateOrderTotal = (
  subtotal: number,
  deliveryFee: number = 5.0,
  taxRate: number = 0.08
): { subtotal: number; deliveryFee: number; tax: number; total: number } => {
  const tax = subtotal * taxRate;
  const total = subtotal + deliveryFee + tax;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

/**
 * Process a refund for an order
 */
export const processRefund = async (params: {
  orderId: string;
  amount: number;
  reason?: string;
}): Promise<{ success: boolean; refundId: string; isFullRefund: boolean }> => {
  try {
    const { data, error } = await supabase.functions.invoke('process-refund', {
      body: {
        order_id: params.orderId,
        amount: params.amount,
        reason: params.reason || 'Refund requested',
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw new Error('Failed to process refund');
  }
};
