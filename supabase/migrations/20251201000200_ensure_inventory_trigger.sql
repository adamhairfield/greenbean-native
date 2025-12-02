-- Ensure inventory trigger is properly set up
-- Drop and recreate to make sure it's using the latest function

DROP TRIGGER IF EXISTS update_product_inventory_on_order ON order_items;

CREATE TRIGGER update_product_inventory_on_order
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_product_inventory();
