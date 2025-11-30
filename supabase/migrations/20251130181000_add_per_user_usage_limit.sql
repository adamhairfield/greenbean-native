-- Add per-user usage limit to promo_codes table
ALTER TABLE promo_codes 
ADD COLUMN IF NOT EXISTS usage_limit_per_user INTEGER;

-- Update the validate_promo_code function to check per-user usage
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
    v_user_usage_count INTEGER;
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

    -- Check global usage limit
    IF v_promo.usage_limit IS NOT NULL AND v_promo.usage_count >= v_promo.usage_limit THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10, 2), 'Promo code usage limit reached'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Check per-user usage limit
    IF v_promo.usage_limit_per_user IS NOT NULL THEN
        SELECT COUNT(*) INTO v_user_usage_count
        FROM promo_code_usage
        WHERE promo_code_id = v_promo.id
        AND user_id = p_user_id;

        IF v_user_usage_count >= v_promo.usage_limit_per_user THEN
            RETURN QUERY SELECT false, 0::DECIMAL(10, 2), 
                'You have already used this promo code the maximum number of times'::TEXT, 
                NULL::UUID;
            RETURN;
        END IF;
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
