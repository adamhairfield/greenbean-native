-- Add RLS policy to allow admins to view all users for analytics

-- Admins and master admins can view all users
CREATE POLICY "Admins can view all users" ON public.profiles
    FOR SELECT USING (
        public.user_has_role(ARRAY['admin', 'master']::user_role[])
    );
