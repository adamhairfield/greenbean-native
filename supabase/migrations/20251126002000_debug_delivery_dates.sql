-- Debug query to see what the function is calculating
-- Run this to see the actual values

SELECT 
  CURRENT_DATE as today,
  EXTRACT(DOW FROM CURRENT_DATE) as today_dow,
  'friday' as target_day,
  5 as target_dow,
  CURRENT_DATE + (5 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER as calculated_friday,
  'monday' as target_day2,
  1 as target_dow2,
  CASE 
    WHEN EXTRACT(DOW FROM CURRENT_DATE) < 1
    THEN CURRENT_DATE + (1 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
    ELSE CURRENT_DATE + (7 + 1 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
  END as calculated_monday;

-- Also check what the function is actually returning
SELECT * FROM get_available_delivery_slots();
