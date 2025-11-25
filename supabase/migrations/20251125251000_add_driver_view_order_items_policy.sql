-- Add RLS policy to allow drivers to view order items for delivery orders

-- Drivers can view order items for orders they can deliver
CREATE POLICY "Drivers can view order items for deliveries" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.status IN ('ready_for_delivery', 'out_for_delivery', 'delivered')
        )
        AND public.user_has_role(ARRAY['driver']::user_role[])
    );
