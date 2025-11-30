-- Add missing columns to orders table if they don't exist
DO $$ 
BEGIN
    -- Add stripe_fee column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'stripe_fee'
    ) THEN
        ALTER TABLE orders ADD COLUMN stripe_fee DECIMAL(10, 2);
    END IF;

    -- Add delivery_date column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_date'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_date DATE;
    END IF;
END $$;
