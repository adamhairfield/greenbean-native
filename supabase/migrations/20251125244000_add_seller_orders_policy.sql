-- Add RLS policy to allow sellers to view orders containing their products

-- Create a helper function to check if user is seller of order
CREATE OR REPLACE FUNCTION is_seller_of_order(order_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN sellers s ON p.seller_id = s.id
        WHERE oi.order_id = order_id_param
        AND s.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to avoid duplicate error
DROP POLICY IF EXISTS "Sellers can view orders with their products" ON orders;

-- Sellers can view orders that contain their products
CREATE POLICY "Sellers can view orders with their products" ON orders
    FOR SELECT USING (
        is_seller_of_order(id)
    );
