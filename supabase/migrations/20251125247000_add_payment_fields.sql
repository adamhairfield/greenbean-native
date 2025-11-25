-- Add payment-related fields to orders table

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS seller_transfers JSONB;

-- Add index for payment intent lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(payment_intent_id);
