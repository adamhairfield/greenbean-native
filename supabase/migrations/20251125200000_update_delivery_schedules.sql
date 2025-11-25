-- Update delivery_schedules table to use day_of_week instead of delivery_window enum

-- Add day_of_week column
ALTER TABLE delivery_schedules 
ADD COLUMN IF NOT EXISTS day_of_week TEXT;

-- Update existing records to have a day_of_week based on delivery_date
UPDATE delivery_schedules 
SET day_of_week = LOWER(TO_CHAR(delivery_date::date, 'Day'))
WHERE day_of_week IS NULL;

-- Make day_of_week required
ALTER TABLE delivery_schedules 
ALTER COLUMN day_of_week SET NOT NULL;

-- Drop the delivery_window column (it's no longer needed)
ALTER TABLE delivery_schedules 
DROP COLUMN IF EXISTS delivery_window;

-- Add a check constraint to ensure valid days
ALTER TABLE delivery_schedules
ADD CONSTRAINT valid_day_of_week 
CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'));
