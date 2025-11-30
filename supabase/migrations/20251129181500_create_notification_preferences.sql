-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Order notifications
    new_order BOOLEAN DEFAULT true,
    order_status_update BOOLEAN DEFAULT true,
    order_delivered BOOLEAN DEFAULT true,
    order_cancelled BOOLEAN DEFAULT true,
    
    -- Refund notifications
    refund_processed BOOLEAN DEFAULT true,
    
    -- Seller notifications
    product_sold BOOLEAN DEFAULT true,
    low_stock_alert BOOLEAN DEFAULT true,
    
    -- Driver notifications
    delivery_assigned BOOLEAN DEFAULT true,
    
    -- Push notification settings
    push_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own preferences"
    ON notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON notification_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create preferences when user is created
CREATE TRIGGER create_notification_preferences_on_signup
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- Create preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;
