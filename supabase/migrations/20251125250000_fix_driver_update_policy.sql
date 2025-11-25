-- Fix driver update policy to not require driver_id column

-- Drop the old policy that requires driver_id
DROP POLICY IF EXISTS "Drivers can update order status" ON orders;

-- Create new policy that allows any driver to update delivery orders
CREATE POLICY "Drivers can update order status" ON orders
    FOR UPDATE USING (
        public.user_has_role(ARRAY['driver']::user_role[])
        AND status IN ('ready_for_delivery', 'out_for_delivery')
    )
    WITH CHECK (
        public.user_has_role(ARRAY['driver']::user_role[])
        AND status IN ('out_for_delivery', 'delivered')
    );
