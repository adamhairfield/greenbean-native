-- Fix driver view sellers policy to avoid infinite recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Drivers can view sellers for deliveries" ON sellers;

-- Create a simpler policy - drivers can view all sellers
-- This is acceptable since drivers need to see pickup locations
CREATE POLICY "Drivers can view sellers" ON sellers
    FOR SELECT USING (
        public.user_has_role(ARRAY['driver']::user_role[])
    );
