-- Simplify delivery_schedules to be truly recurring
-- Remove specific dates and make it template-based

-- Drop the old date columns
ALTER TABLE delivery_schedules 
DROP COLUMN IF EXISTS delivery_date,
DROP COLUMN IF EXISTS cutoff_date;

-- Add cutoff_days_before instead of specific cutoff date
ALTER TABLE delivery_schedules 
ADD COLUMN IF NOT EXISTS cutoff_days_before INTEGER DEFAULT 2;

-- Make sure day_of_week is set
UPDATE delivery_schedules 
SET day_of_week = 'tuesday' 
WHERE day_of_week IS NULL;

-- Add constraint to ensure cutoff_days_before is reasonable
ALTER TABLE delivery_schedules
ADD CONSTRAINT reasonable_cutoff 
CHECK (cutoff_days_before >= 0 AND cutoff_days_before <= 7);

-- Remove current_orders since we'll track that differently
ALTER TABLE delivery_schedules 
DROP COLUMN IF EXISTS current_orders;
