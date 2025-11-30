-- Update order numbers to be more readable
-- New format: GBMMDDXXXX (GB + month/day + 4 random digits)

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_order_number TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate order number: GB + MMDD + 4 random digits
        new_order_number := 'GB' || TO_CHAR(NOW(), 'MMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        -- Check if this order number already exists
        IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_order_number) THEN
            RETURN new_order_number;
        END IF;
        
        counter := counter + 1;
        -- Safety check to prevent infinite loop
        IF counter > 100 THEN
            -- Fallback to timestamp-based if we can't find a unique random number
            new_order_number := 'GB' || TO_CHAR(NOW(), 'MMDDHH24MISS');
            RETURN new_order_number;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
