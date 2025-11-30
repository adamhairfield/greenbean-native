-- Function to notify sellers when they receive a new order
CREATE OR REPLACE FUNCTION notify_sellers_on_new_order()
RETURNS TRIGGER AS $$
DECLARE
    seller_record RECORD;
    order_total DECIMAL;
    should_notify BOOLEAN := false;
    user_prefs RECORD;
BEGIN
    -- Get order total
    SELECT total INTO order_total FROM orders WHERE id = NEW.order_id;
    
    -- Get seller information for this order item
    SELECT 
        p.seller_id,
        p.name as product_name,
        s.user_id as seller_user_id
    INTO seller_record
    FROM products p
    JOIN sellers s ON s.id = p.seller_id
    WHERE p.id = NEW.product_id;
    
    -- If this product has a seller, check if they want notifications
    IF seller_record.seller_user_id IS NOT NULL THEN
        -- Get seller's notification preferences
        SELECT * INTO user_prefs FROM notification_preferences WHERE user_id = seller_record.seller_user_id;
        
        -- Check if seller wants new order notifications (default to true if no preferences)
        IF user_prefs IS NULL THEN
            should_notify := true;
        ELSE
            should_notify := user_prefs.new_order;
        END IF;
        
        -- If seller wants notifications, create one
        IF should_notify THEN
            INSERT INTO notifications (user_id, title, message, type, related_id)
            VALUES (
                seller_record.seller_user_id,
                'New Order Received!',
                format('You have a new order for %s (Qty: %s). Order total: $%s', 
                    seller_record.product_name, 
                    NEW.quantity::text,
                    order_total::text
                ),
                'order',
                NEW.order_id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify sellers when order items are created
DROP TRIGGER IF EXISTS notify_seller_on_order_item_created ON order_items;
CREATE TRIGGER notify_seller_on_order_item_created
    AFTER INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION notify_sellers_on_new_order();
