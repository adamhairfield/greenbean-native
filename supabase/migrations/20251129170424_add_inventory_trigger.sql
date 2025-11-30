-- Migration: Add automatic inventory updates when orders are placed
-- This trigger automatically decrements product stock_quantity when order items are created

-- Function to update product inventory when order items are created
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
    ELSIF TG_OP = 'DELETE' THEN
        -- Restore inventory when order item is deleted (e.g., order cancelled)
        UPDATE products
        SET stock_quantity = stock_quantity + OLD.quantity
        WHERE id = OLD.product_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Adjust inventory when quantity changes
        UPDATE products
        SET stock_quantity = stock_quantity + OLD.quantity - NEW.quantity
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on order_items table
CREATE TRIGGER update_product_inventory_on_order
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_product_inventory();
