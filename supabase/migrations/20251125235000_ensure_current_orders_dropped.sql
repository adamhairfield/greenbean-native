-- Ensure current_orders column is dropped from delivery_schedules
-- This fixes the error: column "current_orders" does not exist

ALTER TABLE delivery_schedules 
DROP COLUMN IF EXISTS current_orders CASCADE;
