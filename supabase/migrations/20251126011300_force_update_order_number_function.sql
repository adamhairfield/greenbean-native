-- Force update the order number generation function
-- Format: GBMMDDXXXX (GB + month/day + 4 random digits)

DROP FUNCTION IF EXISTS generate_order_number();

CREATE FUNCTION generate_order_number()
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;

CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();
