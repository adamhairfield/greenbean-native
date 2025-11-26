-- Check current schedules and reset them to Friday and Monday
-- The dates showing (Thu Nov 27 and Sun Nov 30) indicate schedules are set to Thursday and Sunday

-- First, delete all existing schedules
DELETE FROM delivery_schedules;

-- Insert the correct schedules for Friday and Monday
INSERT INTO delivery_schedules (day_of_week, cutoff_days_before, max_orders, is_active)
VALUES 
  ('friday', 2, 50, true),
  ('monday', 2, 50, true);

-- Verify the schedules
SELECT id, day_of_week, cutoff_days_before, max_orders, is_active 
FROM delivery_schedules 
ORDER BY 
  CASE day_of_week
    WHEN 'monday' THEN 1
    WHEN 'tuesday' THEN 2
    WHEN 'wednesday' THEN 3
    WHEN 'thursday' THEN 4
    WHEN 'friday' THEN 5
    WHEN 'saturday' THEN 6
    WHEN 'sunday' THEN 7
  END;
