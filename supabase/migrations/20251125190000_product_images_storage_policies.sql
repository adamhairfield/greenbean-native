-- Enable RLS on storage.objects for product-images bucket
-- Allow authenticated sellers to upload images

-- Policy: Allow authenticated users to upload images to their own seller folder
CREATE POLICY "Sellers can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM sellers WHERE user_id = auth.uid()
  )
);

-- Policy: Allow public read access to product images
CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Policy: Allow sellers to update their own product images
CREATE POLICY "Sellers can update their product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM sellers WHERE user_id = auth.uid()
  )
);

-- Policy: Allow sellers to delete their own product images
CREATE POLICY "Sellers can delete their product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM sellers WHERE user_id = auth.uid()
  )
);
