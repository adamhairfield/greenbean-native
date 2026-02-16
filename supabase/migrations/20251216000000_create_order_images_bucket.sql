-- Create storage bucket for order images (delivery photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-images', 'order-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload delivery photos
CREATE POLICY "Drivers can upload delivery photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'order-images' 
  AND (storage.foldername(name))[1] = 'delivery-photos'
  AND auth.jwt() ->> 'user_role' = 'driver'
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
  AND auth.jwt() ->> 'user_role' = 'driver'
);

-- Add delivery_photo_url and delivered_at columns to orders table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'delivery_photo_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_photo_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add index for faster queries on delivered orders
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at) WHERE delivered_at IS NOT NULL;
