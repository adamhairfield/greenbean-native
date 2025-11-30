-- Fix delivery slots calculation to count orders by specific date, not day of week
-- The issue: orders were being counted for ALL Fridays, not just Dec 5th specifically

CREATE OR REPLACE FUNCTION get_available_delivery_slots()
RETURNS TABLE (
  schedule_id UUID,
  day_of_week TEXT,
  cutoff_days_before INTEGER,
  max_orders INTEGER,
  is_active BOOLEAN,
  next_delivery_date DATE,
  orders_count BIGINT,
  slots_available INTEGER
) AS $$
DECLARE
  local_date DATE;
  local_dow INTEGER;
BEGIN
  -- Get current date in Eastern Time (America/New_York)
  local_date := (CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York')::DATE;
  local_dow := EXTRACT(DOW FROM local_date);

  RETURN QUERY
  WITH upcoming_dates AS (
    SELECT 
      ds.id as schedule_id,
      ds.day_of_week,
      ds.cutoff_days_before,
      ds.max_orders,
      ds.is_active,
      -- Calculate next occurrence of this day of week
      CASE 
        WHEN local_dow < 
             CASE ds.day_of_week
               WHEN 'sunday' THEN 0
               WHEN 'monday' THEN 1
               WHEN 'tuesday' THEN 2
               WHEN 'wednesday' THEN 3
               WHEN 'thursday' THEN 4
               WHEN 'friday' THEN 5
               WHEN 'saturday' THEN 6
             END
        THEN local_date + (
          CASE ds.day_of_week
            WHEN 'sunday' THEN 0
            WHEN 'monday' THEN 1
            WHEN 'tuesday' THEN 2
            WHEN 'wednesday' THEN 3
            WHEN 'thursday' THEN 4
            WHEN 'friday' THEN 5
            WHEN 'saturday' THEN 6
          END - local_dow
        )::INTEGER
        ELSE local_date + (
          7 + CASE ds.day_of_week
            WHEN 'sunday' THEN 0
            WHEN 'monday' THEN 1
            WHEN 'tuesday' THEN 2
            WHEN 'wednesday' THEN 3
            WHEN 'thursday' THEN 4
            WHEN 'friday' THEN 5
            WHEN 'saturday' THEN 6
          END - local_dow
        )::INTEGER
      END as next_delivery_date
    FROM delivery_schedules ds
    WHERE ds.is_active = true
  ),
  dates_with_counts AS (
    SELECT 
      ud.*,
      -- Count orders for THIS SPECIFIC DATE, not all orders for this day of week
      COUNT(o.id) as orders_count
    FROM upcoming_dates ud
    LEFT JOIN orders o ON 
      -- Match by the actual delivery_date field, not the schedule_id
      o.delivery_date = ud.next_delivery_date
      AND o.status NOT IN ('cancelled')
    WHERE 
      -- Only show if cutoff hasn't passed
      ud.next_delivery_date - ud.cutoff_days_before >= local_date
    GROUP BY 
      ud.schedule_id, 
      ud.day_of_week, 
      ud.cutoff_days_before, 
      ud.max_orders, 
      ud.is_active,
      ud.next_delivery_date
  )
  SELECT 
    dwc.schedule_id,
    dwc.day_of_week,
    dwc.cutoff_days_before,
    dwc.max_orders,
    dwc.is_active,
    dwc.next_delivery_date,
    dwc.orders_count,
    GREATEST(0, dwc.max_orders - dwc.orders_count::INTEGER) as slots_available
  FROM dates_with_counts dwc
  ORDER BY dwc.next_delivery_date ASC;
END;
$$ LANGUAGE plpgsql;
