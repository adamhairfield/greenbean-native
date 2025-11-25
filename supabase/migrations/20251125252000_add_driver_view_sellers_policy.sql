-- Add RLS policy to allow drivers to view seller information for deliveries

-- Drivers can view seller information for orders they are delivering
CREATE POLICY "Drivers can view sellers for deliveries" ON sellers
    FOR SELECT USING (
        public.user_has_role(ARRAY['driver']::user_role[])
        AND EXISTS (
            SELECT 1 FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE p.seller_id = sellers.id
            AND o.status IN ('ready_for_delivery', 'out_for_delivery', 'delivered')
        )
    );
