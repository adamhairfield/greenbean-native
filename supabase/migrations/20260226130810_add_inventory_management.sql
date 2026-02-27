-- Add inventory management features to products table

-- Add low_stock_threshold column
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

-- Add auto_disable_when_out_of_stock column
ALTER TABLE products ADD COLUMN IF NOT EXISTS auto_disable_when_out_of_stock BOOLEAN DEFAULT true;

-- Create function to auto-disable products when stock reaches 0
CREATE OR REPLACE FUNCTION auto_disable_out_of_stock_products()
RETURNS TRIGGER AS $$
BEGIN
    -- If stock quantity reaches 0 and auto-disable is enabled, set is_available to false
    IF NEW.stock_quantity <= 0 AND NEW.auto_disable_when_out_of_stock = true THEN
        NEW.is_available := false;
    END IF;
    
    -- If stock is replenished and product was previously unavailable, auto-enable it
    IF NEW.stock_quantity > 0 AND OLD.stock_quantity <= 0 AND NEW.auto_disable_when_out_of_stock = true THEN
        NEW.is_available := true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-disable functionality
DROP TRIGGER IF EXISTS trigger_auto_disable_out_of_stock ON products;
CREATE TRIGGER trigger_auto_disable_out_of_stock
    BEFORE UPDATE OF stock_quantity ON products
    FOR EACH ROW
    EXECUTE FUNCTION auto_disable_out_of_stock_products();

-- Add index for low stock queries
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(seller_id, stock_quantity) 
WHERE stock_quantity <= low_stock_threshold AND is_available = true;

-- Add total_sales and total_revenue columns for analytics
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10,2) DEFAULT 0;

-- Create function to update product sales stats when order is completed
CREATE OR REPLACE FUNCTION update_product_sales_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update stats when order status changes to 'delivered'
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        -- Update product sales stats for all items in the order
        UPDATE products p
        SET 
            total_sales = total_sales + oi.quantity,
            total_revenue = total_revenue + oi.total_price
        FROM order_items oi
        WHERE oi.order_id = NEW.id
        AND oi.product_id = p.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update sales stats
DROP TRIGGER IF EXISTS trigger_update_product_sales_stats ON orders;
CREATE TRIGGER trigger_update_product_sales_stats
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_product_sales_stats();

-- Backfill sales stats for existing delivered orders
UPDATE products p
SET 
    total_sales = COALESCE(stats.total_quantity, 0),
    total_revenue = COALESCE(stats.total_revenue, 0)
FROM (
    SELECT 
        oi.product_id,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total_price) as total_revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'delivered'
    GROUP BY oi.product_id
) stats
WHERE p.id = stats.product_id;
