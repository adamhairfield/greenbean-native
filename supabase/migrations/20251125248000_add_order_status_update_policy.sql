-- Add RLS policy to allow sellers and drivers to update order status

-- Sellers can update order status from pending to ready_for_delivery
CREATE POLICY "Sellers can update order status to ready" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN sellers s ON p.seller_id = s.id
            WHERE oi.order_id = orders.id
            AND s.user_id = auth.uid()
            AND orders.status = 'pending'
        )
    )
    WITH CHECK (
        status = 'ready_for_delivery'
    );

-- Drivers can update order status for their assigned orders
CREATE POLICY "Drivers can update order status" ON orders
    FOR UPDATE USING (
        driver_id = auth.uid()
        AND status IN ('ready_for_delivery', 'out_for_delivery')
    )
    WITH CHECK (
        status IN ('out_for_delivery', 'delivered')
    );

-- Admins can update any order status
CREATE POLICY "Admins can update order status" ON orders
    FOR UPDATE USING (
        public.user_has_role(ARRAY['admin', 'master']::user_role[])
    );
