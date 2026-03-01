-- Add customer-facing profile fields to sellers table
ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS farm_story TEXT,
ADD COLUMN IF NOT EXISTS growing_practices TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS farm_size TEXT,
ADD COLUMN IF NOT EXISTS established_year INTEGER,
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS farm_location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS farm_location_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS public_email TEXT,
ADD COLUMN IF NOT EXISTS public_phone TEXT,
ADD COLUMN IF NOT EXISTS visiting_hours TEXT,
ADD COLUMN IF NOT EXISTS accepts_farm_visits BOOLEAN DEFAULT false;

-- Create seller_photos table for farm photo gallery
CREATE TABLE IF NOT EXISTS seller_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster seller photo lookups
CREATE INDEX IF NOT EXISTS idx_seller_photos_seller_id ON seller_photos(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_photos_display_order ON seller_photos(seller_id, display_order);

-- Add RLS policies for seller_photos
ALTER TABLE seller_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can view seller photos (public profiles)
CREATE POLICY "Anyone can view seller photos" ON seller_photos
    FOR SELECT USING (true);

-- Sellers can manage their own photos
CREATE POLICY "Sellers can insert own photos" ON seller_photos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sellers
            WHERE sellers.id = seller_photos.seller_id
            AND sellers.user_id = auth.uid()
        )
    );

CREATE POLICY "Sellers can update own photos" ON seller_photos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sellers
            WHERE sellers.id = seller_photos.seller_id
            AND sellers.user_id = auth.uid()
        )
    );

CREATE POLICY "Sellers can delete own photos" ON seller_photos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sellers
            WHERE sellers.id = seller_photos.seller_id
            AND sellers.user_id = auth.uid()
        )
    );

-- Admins can manage all seller photos
CREATE POLICY "Admins can manage all seller photos" ON seller_photos
    FOR ALL USING (
        public.user_has_role(ARRAY['admin', 'master']::user_role[])
    );

-- Update sellers RLS to allow public viewing of seller profiles
CREATE POLICY "Anyone can view seller profiles" ON sellers
    FOR SELECT USING (is_active = true);

-- Create trigger to update seller_photos updated_at
CREATE OR REPLACE FUNCTION update_seller_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER seller_photos_updated_at
    BEFORE UPDATE ON seller_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_seller_photos_updated_at();

-- Add comments for documentation
COMMENT ON COLUMN sellers.farm_story IS 'Customer-facing story about the farm and farming philosophy';
COMMENT ON COLUMN sellers.growing_practices IS 'Description of growing methods, sustainability practices, etc.';
COMMENT ON COLUMN sellers.certifications IS 'Array of certifications (e.g., Organic, Non-GMO, etc.)';
COMMENT ON COLUMN sellers.farm_size IS 'Size of the farm (e.g., "5 acres", "20 hectares")';
COMMENT ON COLUMN sellers.specialties IS 'Array of farm specialties (e.g., "Heirloom Tomatoes", "Pastured Eggs")';
COMMENT ON COLUMN sellers.social_media IS 'JSON object with social media links (instagram, facebook, twitter, etc.)';
COMMENT ON COLUMN sellers.accepts_farm_visits IS 'Whether the farm accepts customer visits';
COMMENT ON TABLE seller_photos IS 'Photo gallery for seller/farm profiles visible to customers';
