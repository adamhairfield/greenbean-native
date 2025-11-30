-- Retroactively update inventory for existing orders
-- This will adjust stock_quantity for all products that have been ordered

-- Update inventory based on all existing order items
UPDATE products p
SET stock_quantity = stock_quantity - (
    SELECT COALESCE(SUM(oi.quantity), 0)
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = p.id
    AND o.status NOT IN ('cancelled')
    AND o.created_at >= NOW() - INTERVAL '1 hour'  -- Only orders from the last hour
)
WHERE p.id IN (
    SELECT DISTINCT oi.product_id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status NOT IN ('cancelled')
    AND o.created_at >= NOW() - INTERVAL '1 hour'
);
