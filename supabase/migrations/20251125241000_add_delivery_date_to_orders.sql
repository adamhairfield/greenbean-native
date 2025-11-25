-- Add delivery_date column to orders table
-- This stores the actual calculated delivery date for the order

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_date DATE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_schedule_date ON orders(delivery_schedule_id, delivery_date);
