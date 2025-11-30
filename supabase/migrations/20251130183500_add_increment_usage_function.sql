-- Create a simple function to increment promo code usage count
CREATE OR REPLACE FUNCTION increment_promo_usage(p_promo_code_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE promo_codes
    SET usage_count = usage_count + 1
    WHERE id = p_promo_code_id;
END;
$$ LANGUAGE plpgsql;
