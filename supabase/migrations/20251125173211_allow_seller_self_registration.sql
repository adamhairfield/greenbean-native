-- Allow users to create their own seller account
CREATE POLICY "Users can create their own seller account"
ON sellers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own seller account
CREATE POLICY "Users can view their own seller account"
ON sellers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own seller account
CREATE POLICY "Users can update their own seller account"
ON sellers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
