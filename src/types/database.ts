export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'customer' | 'driver' | 'admin' | 'master';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready_for_delivery' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type DeliveryWindow = 'monday_wednesday' | 'thursday_saturday';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          street_address: string;
          apartment: string | null;
          city: string;
          state: string;
          zip_code: string;
          delivery_instructions: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          street_address: string;
          apartment?: string | null;
          city: string;
          state: string;
          zip_code: string;
          delivery_instructions?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          street_address?: string;
          apartment?: string | null;
          city?: string;
          state?: string;
          zip_code?: string;
          delivery_instructions?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          unit: string;
          image_url: string | null;
          stock_quantity: number;
          is_available: boolean;
          farm_name: string | null;
          farm_location: string | null;
          is_organic: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          price: number;
          unit: string;
          image_url?: string | null;
          stock_quantity?: number;
          is_available?: boolean;
          farm_name?: string | null;
          farm_location?: string | null;
          is_organic?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          description?: string | null;
          price?: number;
          unit?: string;
          image_url?: string | null;
          stock_quantity?: number;
          is_available?: boolean;
          farm_name?: string | null;
          farm_location?: string | null;
          is_organic?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      delivery_schedules: {
        Row: {
          id: string;
          delivery_window: DeliveryWindow;
          delivery_date: string;
          cutoff_date: string;
          max_orders: number;
          current_orders: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          delivery_window: DeliveryWindow;
          delivery_date: string;
          cutoff_date: string;
          max_orders?: number;
          current_orders?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          delivery_window?: DeliveryWindow;
          delivery_date?: string;
          cutoff_date?: string;
          max_orders?: number;
          current_orders?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          delivery_address_id: string;
          delivery_schedule_id: string | null;
          driver_id: string | null;
          order_number: string;
          status: OrderStatus;
          subtotal: number;
          delivery_fee: number;
          tax: number;
          total: number;
          payment_status: PaymentStatus;
          special_instructions: string | null;
          estimated_delivery_time: string | null;
          actual_delivery_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          delivery_address_id: string;
          delivery_schedule_id?: string | null;
          driver_id?: string | null;
          order_number: string;
          status?: OrderStatus;
          subtotal: number;
          delivery_fee?: number;
          tax?: number;
          total: number;
          payment_status?: PaymentStatus;
          special_instructions?: string | null;
          estimated_delivery_time?: string | null;
          actual_delivery_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          delivery_address_id?: string;
          delivery_schedule_id?: string | null;
          driver_id?: string | null;
          order_number?: string;
          status?: OrderStatus;
          subtotal?: number;
          delivery_fee?: number;
          tax?: number;
          total?: number;
          payment_status?: PaymentStatus;
          special_instructions?: string | null;
          estimated_delivery_time?: string | null;
          actual_delivery_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          created_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          created_at?: string;
        };
      };
      driver_assignments: {
        Row: {
          id: string;
          driver_id: string;
          delivery_schedule_id: string;
          max_deliveries: number;
          current_deliveries: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          delivery_schedule_id: string;
          max_deliveries?: number;
          current_deliveries?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          driver_id?: string;
          delivery_schedule_id?: string;
          max_deliveries?: number;
          current_deliveries?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          related_order_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read?: boolean;
          related_order_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          is_read?: boolean;
          related_order_id?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      delivery_window: DeliveryWindow;
      payment_status: PaymentStatus;
    };
  };
}
