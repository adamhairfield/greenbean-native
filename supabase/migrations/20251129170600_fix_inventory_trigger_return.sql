-- Fix inventory trigger to return correct value for DELETE operations
-- The trigger was returning NEW for DELETE which is NULL and could cause issues

CREATE OR REPLACE FUNCTION update_product_inventory()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Decrease inventory when order item is created
        UPDATE products
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.product_id;
        
        -- Check if inventory went negative (shouldn't happen with proper validation)
        IF (SELECT stock_quantity FROM products WHERE id = NEW.product_id) < 0 THEN
            RAISE EXCEPTION 'Insufficient inventory for product %', NEW.product_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Restore inventory when order item is deleted (e.g., order cancelled)
        UPDATE products
        SET stock_quantity = stock_quantity + OLD.quantity
        WHERE id = OLD.product_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Adjust inventory when quantity changes
        UPDATE products
        SET stock_quantity = stock_quantity + OLD.quantity - NEW.quantity
        WHERE id = NEW.product_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
