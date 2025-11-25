-- Add RLS policies for order_items so users can view items in their orders

-- Drop existing policy if any
DROP POLICY IF EXISTS "Users can view order items for their orders" ON order_items;

-- Customers can view items in their own orders
CREATE POLICY "Customers can view items in their orders" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.customer_id = auth.uid()
        )
    );

-- Sellers can view items in orders containing their products
CREATE POLICY "Sellers can view items with their products" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products p
            JOIN sellers s ON p.seller_id = s.id
            WHERE p.id = order_items.product_id
            AND s.user_id = auth.uid()
        )
    );

-- Admins can view all order items
CREATE POLICY "Admins can view all order items" ON order_items
    FOR SELECT USING (
        public.user_has_role(ARRAY['admin', 'master']::user_role[])
    );
