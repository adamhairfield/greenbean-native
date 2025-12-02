-- Enable the inventory trigger that was disabled
-- Using ENABLE ALWAYS to ensure it fires even in replica mode
ALTER TABLE order_items ENABLE ALWAYS TRIGGER update_product_inventory_on_order;
