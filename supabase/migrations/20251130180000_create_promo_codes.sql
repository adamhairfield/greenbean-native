-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promo_code_usage table to track individual uses
CREATE TABLE IF NOT EXISTS promo_code_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    order_id UUID REFERENCES orders(id),
    discount_amount DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_user ON promo_code_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_promo ON promo_code_usage(promo_code_id);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'promo_codes' AND policyname = 'Anyone can view active promo codes'
    ) THEN
        CREATE POLICY "Anyone can view active promo codes" ON promo_codes
            FOR SELECT USING (is_active = true);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'promo_codes' AND policyname = 'Master admins can manage promo codes'
    ) THEN
        CREATE POLICY "Master admins can manage promo codes" ON promo_codes
            FOR ALL USING (
                public.user_has_role(ARRAY['master']::user_role[])
            );
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for promo_code_usage
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'promo_code_usage' AND policyname = 'Users can view their own usage'
    ) THEN
        CREATE POLICY "Users can view their own usage" ON promo_code_usage
            FOR SELECT USING (user_id = auth.uid());
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'promo_code_usage' AND policyname = 'System can insert usage records'
    ) THEN
        CREATE POLICY "System can insert usage records" ON promo_code_usage
            FOR INSERT WITH CHECK (true);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Function to validate and apply promo code
CREATE OR REPLACE FUNCTION validate_promo_code(
    p_code VARCHAR(50),
    p_user_id UUID,
    p_order_total DECIMAL(10, 2)
)
RETURNS TABLE (
    valid BOOLEAN,
    discount_amount DECIMAL(10, 2),
    message TEXT,
    promo_code_id UUID
) AS $$
DECLARE
    v_promo promo_codes%ROWTYPE;
    v_discount DECIMAL(10, 2);
BEGIN
    -- Get promo code
    SELECT * INTO v_promo
    FROM promo_codes
    WHERE code = p_code
    AND is_active = true;

    -- Check if promo code exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10, 2), 'Invalid promo code'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Check if promo code is within valid date range
    IF v_promo.valid_from > NOW() THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10, 2), 'Promo code not yet valid'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < NOW() THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10, 2), 'Promo code has expired'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Check usage limit
    IF v_promo.usage_limit IS NOT NULL AND v_promo.usage_count >= v_promo.usage_limit THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10, 2), 'Promo code usage limit reached'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Check minimum order amount
    IF p_order_total < v_promo.min_order_amount THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10, 2), 
            format('Minimum order amount of $%s required', v_promo.min_order_amount)::TEXT, 
            NULL::UUID;
        RETURN;
    END IF;

    -- Calculate discount
    IF v_promo.discount_type = 'percentage' THEN
        v_discount := p_order_total * (v_promo.discount_value / 100);
    ELSE
        v_discount := v_promo.discount_value;
    END IF;

    -- Apply max discount cap if set
    IF v_promo.max_discount_amount IS NOT NULL AND v_discount > v_promo.max_discount_amount THEN
        v_discount := v_promo.max_discount_amount;
    END IF;

    -- Ensure discount doesn't exceed order total
    IF v_discount > p_order_total THEN
        v_discount := p_order_total;
    END IF;

    RETURN QUERY SELECT true, v_discount, 'Promo code applied successfully'::TEXT, v_promo.id;
END;
$$ LANGUAGE plpgsql;
