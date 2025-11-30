-- Add stripe_payment_intent_id, stripe_fee, and delivery_date to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_fee DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS delivery_date DATE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);
