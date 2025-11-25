-- Drop and recreate the foreign key constraint to delivery_schedules
-- This should remove any reference to current_orders

-- Drop the existing foreign key
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_delivery_schedule_id_fkey CASCADE;

-- Recreate it cleanly
ALTER TABLE orders
ADD CONSTRAINT orders_delivery_schedule_id_fkey 
FOREIGN KEY (delivery_schedule_id) 
REFERENCES delivery_schedules(id)
ON DELETE SET NULL;
