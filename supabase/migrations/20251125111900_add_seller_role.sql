-- Add seller role to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'seller';

-- Create sellers table for Stripe Connect information
CREATE TABLE IF NOT EXISTS sellers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    business_description TEXT,
    business_address TEXT,
    business_phone TEXT,
    business_email TEXT,
    
    -- Stripe Connect fields
    stripe_account_id TEXT UNIQUE,
    stripe_account_status TEXT DEFAULT 'pending', -- pending, active, restricted, disabled
    stripe_onboarding_completed BOOLEAN DEFAULT false,
    stripe_charges_enabled BOOLEAN DEFAULT false,
    stripe_payouts_enabled BOOLEAN DEFAULT false,
    
    -- Platform fee configuration (percentage)
    platform_fee_percentage DECIMAL(5, 2) DEFAULT 10.00, -- 10% default platform fee
    delivery_fee_percentage DECIMAL(5, 2) DEFAULT 100.00, -- 100% of delivery fee goes to platform
    
    -- Business verification
    is_verified BOOLEAN DEFAULT false,
    verification_notes TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add seller_id to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE;

-- Create index for faster seller product lookups
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);

-- Add RLS policies for sellers table
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own seller profile
CREATE POLICY "Sellers can view own profile" ON sellers
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Sellers can update their own seller profile
CREATE POLICY "Sellers can update own profile" ON sellers
    FOR UPDATE USING (
        user_id = auth.uid()
    );

-- Admins and masters can view all seller profiles
CREATE POLICY "Admins can view all seller profiles" ON sellers
    FOR SELECT USING (
        public.user_has_role(ARRAY['admin', 'master']::user_role[])
    );

-- Admins and masters can update all seller profiles
CREATE POLICY "Admins can update all seller profiles" ON sellers
    FOR UPDATE USING (
        public.user_has_role(ARRAY['admin', 'master']::user_role[])
    );

-- Admins and masters can insert seller profiles
CREATE POLICY "Admins can insert seller profiles" ON sellers
    FOR INSERT WITH CHECK (
        public.user_has_role(ARRAY['admin', 'master']::user_role[])
    );

-- Update products RLS policies to allow sellers to manage their own products

-- Sellers can view their own products
CREATE POLICY "Sellers can view own products" ON products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sellers
            WHERE sellers.id = products.seller_id
            AND sellers.user_id = auth.uid()
        )
    );

-- Sellers can insert their own products
CREATE POLICY "Sellers can insert own products" ON products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sellers
            WHERE sellers.id = products.seller_id
            AND sellers.user_id = auth.uid()
        )
    );

-- Sellers can update their own products
CREATE POLICY "Sellers can update own products" ON products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sellers
            WHERE sellers.id = products.seller_id
            AND sellers.user_id = auth.uid()
        )
    );

-- Sellers can delete their own products
CREATE POLICY "Sellers can delete own products" ON products
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sellers
            WHERE sellers.id = products.seller_id
            AND sellers.user_id = auth.uid()
        )
    );

-- Create order_items_sellers view for seller revenue tracking
CREATE OR REPLACE VIEW order_items_with_seller AS
SELECT 
    oi.*,
    p.seller_id,
    p.price as product_price,
    s.platform_fee_percentage,
    s.stripe_account_id,
    o.status as order_status,
    o.payment_status,
    -- Calculate seller revenue (unit_price * quantity - platform fee)
    (oi.unit_price * oi.quantity * (1 - (COALESCE(s.platform_fee_percentage, 0) / 100))) as seller_revenue,
    -- Calculate platform fee
    (oi.unit_price * oi.quantity * (COALESCE(s.platform_fee_percentage, 0) / 100)) as platform_fee
FROM order_items oi
JOIN products p ON oi.product_id = p.id
LEFT JOIN sellers s ON p.seller_id = s.id
JOIN orders o ON oi.order_id = o.id;

-- Grant access to the view
GRANT SELECT ON order_items_with_seller TO authenticated;

-- Create function to get seller dashboard stats
CREATE OR REPLACE FUNCTION get_seller_stats(seller_uuid UUID)
RETURNS TABLE (
    total_products BIGINT,
    active_products BIGINT,
    total_orders BIGINT,
    total_revenue NUMERIC,
    pending_revenue NUMERIC,
    paid_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT p.id) FILTER (WHERE p.is_available = true) as active_products,
        COUNT(DISTINCT oi.order_id) as total_orders,
        COALESCE(SUM(oi.seller_revenue), 0) as total_revenue,
        COALESCE(SUM(oi.seller_revenue) FILTER (WHERE oi.payment_status = 'pending'), 0) as pending_revenue,
        COALESCE(SUM(oi.seller_revenue) FILTER (WHERE oi.payment_status = 'paid'), 0) as paid_revenue
    FROM sellers s
    LEFT JOIN products p ON s.id = p.seller_id
    LEFT JOIN order_items_with_seller oi ON p.id = oi.product_id
    WHERE s.id = seller_uuid
    GROUP BY s.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sellers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sellers_updated_at
    BEFORE UPDATE ON sellers
    FOR EACH ROW
    EXECUTE FUNCTION update_sellers_updated_at();

-- Add comment for documentation
COMMENT ON TABLE sellers IS 'Stores seller information and Stripe Connect account details for marketplace sellers';
COMMENT ON COLUMN sellers.platform_fee_percentage IS 'Percentage of each sale that goes to the platform (default 10%)';
COMMENT ON COLUMN sellers.delivery_fee_percentage IS 'Percentage of delivery fee that goes to platform (default 100%)';
