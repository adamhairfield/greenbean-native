import { Database } from './database';

export type Seller = Database['public']['Tables']['sellers']['Row'];
export type SellerInsert = Database['public']['Tables']['sellers']['Insert'];
export type SellerUpdate = Database['public']['Tables']['sellers']['Update'];

export interface SellerStats {
  total_products: number;
  active_products: number;
  total_orders: number;
  total_revenue: number;
  pending_revenue: number;
  paid_revenue: number;
}

export interface StripeConnectOnboardingData {
  business_name: string;
  business_email: string;
  business_phone?: string;
  business_address?: string;
  business_description?: string;
}

export interface StripeConnectAccountStatus {
  account_id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  };
}
