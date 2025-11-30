-- Add show_on_banner field to promo_codes table
ALTER TABLE promo_codes 
ADD COLUMN IF NOT EXISTS show_on_banner BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_promo_codes_show_on_banner ON promo_codes(show_on_banner) WHERE show_on_banner = true;

-- Add comment
COMMENT ON COLUMN promo_codes.show_on_banner IS 'Whether this promo code should be displayed on the home screen banner';
