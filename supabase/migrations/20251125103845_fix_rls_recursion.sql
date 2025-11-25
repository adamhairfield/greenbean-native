-- Fix infinite recursion in RLS policies
-- This migration creates a helper function to check user roles without triggering RLS

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins and masters can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Drivers can view delivery addresses" ON addresses;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Admins can manage delivery schedules" ON delivery_schedules;
DROP POLICY IF EXISTS "Drivers can view assigned orders" ON orders;
DROP POLICY IF EXISTS "Drivers can update assigned orders" ON orders;
DROP POLICY IF EXISTS "Users can view order items for their orders" ON order_items;
DROP POLICY IF EXISTS "Drivers can view their assignments" ON driver_assignments;
DROP POLICY IF EXISTS "Admins can manage driver assignments" ON driver_assignments;

-- Create a helper function to check user role without triggering RLS
CREATE OR REPLACE FUNCTION public.user_has_role(required_roles user_role[])
RETURNS BOOLEAN AS $$
DECLARE
    user_role_value user_role;
BEGIN
    -- Get the user's role directly from profiles table
    -- SECURITY DEFINER allows this function to bypass RLS
    SELECT role INTO user_role_value
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- Check if user's role is in the required roles array
    RETURN user_role_value = ANY(required_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate profiles policies without recursion
CREATE POLICY "Admins and masters can view all profiles" ON profiles
    FOR SELECT USING (
        public.user_has_role(ARRAY['admin', 'master']::user_role[])
    );

-- Recreate addresses policies
CREATE POLICY "Drivers can view delivery addresses" ON addresses
    FOR SELECT USING (
        public.user_has_role(ARRAY['driver', 'admin', 'master']::user_role[])
    );

-- Recreate categories policies
CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (
        public.user_has_role(ARRAY['admin', 'master']::user_role[])
    );

-- Recreate products policies
CREATE POLICY "Admins can manage products" ON products
    FOR ALL USING (
        public.user_has_role(ARRAY['admin', 'master']::user_role[])
    );

-- Recreate delivery schedules policies
CREATE POLICY "Admins can manage delivery schedules" ON delivery_schedules
    FOR ALL USING (
        public.user_has_role(ARRAY['admin', 'master']::user_role[])
    );

-- Recreate orders policies
CREATE POLICY "Drivers can view assigned orders" ON orders
    FOR SELECT USING (
        auth.uid() = driver_id OR
        public.user_has_role(ARRAY['admin', 'master']::user_role[])
    );

CREATE POLICY "Drivers can update assigned orders" ON orders
    FOR UPDATE USING (
        auth.uid() = driver_id OR
        public.user_has_role(ARRAY['admin', 'master']::user_role[])
    );

-- Recreate order items policies
CREATE POLICY "Users can view order items for their orders" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND (orders.customer_id = auth.uid() OR orders.driver_id = auth.uid())
        ) OR
        public.user_has_role(ARRAY['admin', 'master']::user_role[])
    );

-- Recreate driver assignments policies
CREATE POLICY "Drivers can view their assignments" ON driver_assignments
    FOR SELECT USING (
        auth.uid() = driver_id OR
        public.user_has_role(ARRAY['admin', 'master']::user_role[])
    );

CREATE POLICY "Admins can manage driver assignments" ON driver_assignments
    FOR ALL USING (
        public.user_has_role(ARRAY['admin', 'master']::user_role[])
    );
