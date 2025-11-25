-- Drop the trigger and function that updates current_orders
-- This is causing the error since current_orders column no longer exists

DROP TRIGGER IF EXISTS update_delivery_schedule_order_count ON orders;
DROP FUNCTION IF EXISTS update_delivery_schedule_count();
