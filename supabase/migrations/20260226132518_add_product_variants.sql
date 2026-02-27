-- Add product variants system for different sizes, packaging, quality tiers, and bundles

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Variant details
  variant_name VARCHAR(100) NOT NULL, -- e.g., "Small", "1lb Bag", "Premium"
  variant_type VARCHAR(50) NOT NULL, -- 'size', 'packaging', 'quality', 'custom'
  
  -- Pricing
  price_adjustment DECIMAL(10,2) DEFAULT 0, -- Price difference from base product (+/-)
  price_override DECIMAL(10,2), -- Or set absolute price (overrides base + adjustment)
  
  -- Inventory
  sku VARCHAR(100), -- Unique SKU for this variant
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  
  -- Availability
  is_available BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Mark one variant as default
  
  -- Display
  sort_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique variant names per product
  UNIQUE(product_id, variant_name)
);

-- Create index for faster queries
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_available ON product_variants(product_id, is_available);

-- Create product_bundles table for bundle products
CREATE TABLE IF NOT EXISTS product_bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bundle_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  included_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  included_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent adding a product to its own bundle
  CONSTRAINT no_self_bundle CHECK (bundle_product_id != included_product_id),
  -- Ensure unique product/variant combinations in bundle
  UNIQUE(bundle_product_id, included_product_id, included_variant_id)
);

-- Create index for bundle queries
CREATE INDEX idx_product_bundles_bundle_id ON product_bundles(bundle_product_id);

-- Add is_bundle flag to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT false;

-- Add has_variants flag to products table  
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

-- Function to auto-update has_variants flag
CREATE OR REPLACE FUNCTION update_product_has_variants()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the product's has_variants flag based on variant count
  UPDATE products
  SET has_variants = EXISTS (
    SELECT 1 FROM product_variants 
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
  )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update has_variants when variants are added/removed
DROP TRIGGER IF EXISTS trigger_update_has_variants ON product_variants;
CREATE TRIGGER trigger_update_has_variants
  AFTER INSERT OR DELETE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_has_variants();

-- Function to auto-disable variant when stock reaches 0
CREATE OR REPLACE FUNCTION auto_disable_variant_out_of_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- If stock quantity reaches 0, set is_available to false
  IF NEW.stock_quantity <= 0 THEN
    NEW.is_available := false;
  END IF;
  
  -- If stock is replenished and was previously unavailable, auto-enable it
  IF NEW.stock_quantity > 0 AND OLD.stock_quantity <= 0 THEN
    NEW.is_available := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for variant auto-disable
DROP TRIGGER IF EXISTS trigger_auto_disable_variant ON product_variants;
CREATE TRIGGER trigger_auto_disable_variant
  BEFORE UPDATE OF stock_quantity ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION auto_disable_variant_out_of_stock();

-- Update order_items to support variants
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_name VARCHAR(100);

-- Add index for order items with variants
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id) WHERE variant_id IS NOT NULL;

-- Function to get effective price for a product (considering variants)
CREATE OR REPLACE FUNCTION get_variant_price(
  base_price DECIMAL(10,2),
  price_override DECIMAL(10,2),
  price_adjustment DECIMAL(10,2)
)
RETURNS DECIMAL(10,2) AS $$
BEGIN
  -- If price_override is set, use it
  IF price_override IS NOT NULL THEN
    RETURN price_override;
  END IF;
  
  -- Otherwise, use base price + adjustment
  RETURN base_price + COALESCE(price_adjustment, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update updated_at timestamp for variants
CREATE OR REPLACE FUNCTION update_variant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_variant_timestamp ON product_variants;
CREATE TRIGGER trigger_update_variant_timestamp
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_variant_updated_at();
