-- Fix storage policies for order-images bucket to use correct JWT structure
-- Drop existing policies
DROP POLICY IF EXISTS "Drivers can upload delivery photos" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can delete their delivery photos" ON storage.objects;

-- Allow authenticated users (drivers) to upload delivery photos
-- Check if user has driver role using the profiles table
CREATE POLICY "Drivers can upload delivery photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'order-images' 
  AND (storage.foldername(name))[1] = 'delivery-photos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'driver'
  )
);

-- Allow drivers to delete their own uploaded photos
CREATE POLICY "Drivers can delete their delivery photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'order-images'
  AND (storage.foldername(name))[1] = 'delivery-photos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'driver'
  )
);
