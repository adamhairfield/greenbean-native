-- Force enable the inventory trigger using ENABLE ALWAYS
-- This ensures it fires even in replica mode and can't be disabled by session settings
ALTER TABLE order_items ENABLE ALWAYS TRIGGER update_product_inventory_on_order;
