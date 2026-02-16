-- Drop existing policies
DROP POLICY IF EXISTS "Drivers can upload delivery photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view delivery photos" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can delete their delivery photos" ON storage.objects;

-- Allow authenticated users with driver role to upload delivery photos
CREATE POLICY "Drivers can upload delivery photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'order-images' 
  AND (storage.foldername(name))[1] = 'delivery-photos'
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.raw_user_meta_data->>'role' = 'driver'
  )
);

-- Allow anyone to view delivery photos (public bucket)
CREATE POLICY "Anyone can view delivery photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'order-images');

-- Allow drivers to delete their own uploaded photos
CREATE POLICY "Drivers can delete their delivery photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'order-images'
  AND (storage.foldername(name))[1] = 'delivery-photos'
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.raw_user_meta_data->>'role' = 'driver'
  )
);
