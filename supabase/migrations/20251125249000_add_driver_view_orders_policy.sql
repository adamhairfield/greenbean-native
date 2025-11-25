-- Add RLS policy to allow drivers to view orders ready for delivery

-- Drivers can view orders that are ready for delivery or out for delivery
CREATE POLICY "Drivers can view delivery orders" ON orders
    FOR SELECT USING (
        public.user_has_role(ARRAY['driver']::user_role[])
        AND status IN ('ready_for_delivery', 'out_for_delivery', 'delivered')
    );
