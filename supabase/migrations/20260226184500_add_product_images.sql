-- Create product_images table for multiple images per product
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary);

-- Add RLS policies
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Allow sellers to manage their product images
CREATE POLICY "Sellers can view their product images"
    ON product_images FOR SELECT
    USING (
        product_id IN (
            SELECT id FROM products WHERE seller_id = auth.uid()
        )
    );

CREATE POLICY "Sellers can insert their product images"
    ON product_images FOR INSERT
    WITH CHECK (
        product_id IN (
            SELECT id FROM products WHERE seller_id = auth.uid()
        )
    );

CREATE POLICY "Sellers can update their product images"
    ON product_images FOR UPDATE
    USING (
        product_id IN (
            SELECT id FROM products WHERE seller_id = auth.uid()
        )
    );

CREATE POLICY "Sellers can delete their product images"
    ON product_images FOR DELETE
    USING (
        product_id IN (
            SELECT id FROM products WHERE seller_id = auth.uid()
        )
    );

-- Allow customers to view all product images
CREATE POLICY "Customers can view all product images"
    ON product_images FOR SELECT
    USING (true);

-- Function to ensure only one primary image per product
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this image as primary, unset all other primary images for this product
    IF NEW.is_primary = true THEN
        UPDATE product_images
        SET is_primary = false
        WHERE product_id = NEW.product_id
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one primary image
CREATE TRIGGER ensure_single_primary_image_trigger
    BEFORE INSERT OR UPDATE ON product_images
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_image();

-- Function to update products.image_url when primary image changes
CREATE OR REPLACE FUNCTION sync_primary_image_to_product()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the product's image_url with the primary image
    IF NEW.is_primary = true THEN
        UPDATE products
        SET image_url = NEW.image_url
        WHERE id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync primary image to products table
CREATE TRIGGER sync_primary_image_trigger
    AFTER INSERT OR UPDATE ON product_images
    FOR EACH ROW
    WHEN (NEW.is_primary = true)
    EXECUTE FUNCTION sync_primary_image_to_product();

-- Function to handle image deletion
CREATE OR REPLACE FUNCTION handle_image_deletion()
RETURNS TRIGGER AS $$
DECLARE
    remaining_count INTEGER;
    new_primary_image TEXT;
BEGIN
    -- Count remaining images for this product
    SELECT COUNT(*) INTO remaining_count
    FROM product_images
    WHERE product_id = OLD.product_id;
    
    -- If the deleted image was primary and there are other images, set the first one as primary
    IF OLD.is_primary = true AND remaining_count > 0 THEN
        UPDATE product_images
        SET is_primary = true
        WHERE id = (
            SELECT id FROM product_images
            WHERE product_id = OLD.product_id
            ORDER BY sort_order, created_at
            LIMIT 1
        );
    END IF;
    
    -- If no images remain, clear the product's image_url
    IF remaining_count = 0 THEN
        UPDATE products
        SET image_url = NULL
        WHERE id = OLD.product_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for image deletion
CREATE TRIGGER handle_image_deletion_trigger
    AFTER DELETE ON product_images
    FOR EACH ROW
    EXECUTE FUNCTION handle_image_deletion();

-- Migrate existing product images to product_images table
INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
SELECT 
    id as product_id,
    image_url,
    true as is_primary,
    0 as sort_order
FROM products
WHERE image_url IS NOT NULL AND image_url != '';

-- Add updated_at trigger
CREATE TRIGGER update_product_images_updated_at
    BEFORE UPDATE ON product_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
