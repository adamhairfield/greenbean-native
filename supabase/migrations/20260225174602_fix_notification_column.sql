-- Fix notification trigger to use correct column name (related_order_id instead of related_id)
CREATE OR REPLACE FUNCTION notify_customer_on_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    notification_title TEXT;
    notification_message TEXT;
    notification_type TEXT := 'order';
    preference_key TEXT;
    should_notify BOOLEAN := false;
    user_prefs RECORD;
BEGIN
    -- Only notify if status actually changed
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Determine notification content based on new status
    CASE NEW.status
        WHEN 'confirmed' THEN
            notification_title := 'Order Confirmed';
            notification_message := format('Your order #%s has been confirmed and is being prepared.', 
                substring(NEW.id::text, 1, 8));
            preference_key := 'order_status_update';
            
        WHEN 'ready_for_delivery' THEN
            notification_title := 'Order Ready for Delivery';
            notification_message := format('Your order #%s is ready and will be delivered soon.', 
                substring(NEW.id::text, 1, 8));
            preference_key := 'order_status_update';
            
        WHEN 'out_for_delivery' THEN
            notification_title := 'Order Out for Delivery';
            notification_message := format('Your order #%s is on its way! Your driver will arrive soon.', 
                substring(NEW.id::text, 1, 8));
            preference_key := 'order_status_update';
            
        WHEN 'delivered' THEN
            notification_title := 'Order Delivered';
            notification_message := format('Your order #%s has been delivered. Enjoy your fresh products!', 
                substring(NEW.id::text, 1, 8));
            preference_key := 'order_delivered';
            
        WHEN 'cancelled' THEN
            notification_title := 'Order Cancelled';
            notification_message := format('Your order #%s has been cancelled.', 
                substring(NEW.id::text, 1, 8));
            preference_key := 'order_cancelled';
            
        ELSE
            -- For other statuses, don't send notification
            RETURN NEW;
    END CASE;

    -- Get user preferences
    SELECT * INTO user_prefs FROM notification_preferences WHERE user_id = NEW.customer_id;

    -- Check if user wants this notification (default to true if no preferences set)
    IF user_prefs IS NULL THEN
        should_notify := true;
    ELSE
        CASE preference_key
            WHEN 'order_status_update' THEN
                should_notify := user_prefs.order_status_update;
            WHEN 'order_delivered' THEN
                should_notify := user_prefs.order_delivered;
            WHEN 'order_cancelled' THEN
                should_notify := user_prefs.order_cancelled;
        END CASE;
    END IF;

    -- If user has notifications enabled, create notification
    IF should_notify THEN
        INSERT INTO notifications (user_id, title, message, type, related_order_id)
        VALUES (
            NEW.customer_id,
            notification_title,
            notification_message,
            notification_type,
            NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
