-- Fix ambiguous column reference in delivery slots function

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
             CASE LOWER(ds.day_of_week)
               WHEN 'sunday' THEN 0
               WHEN 'monday' THEN 1
               WHEN 'tuesday' THEN 2
               WHEN 'wednesday' THEN 3
               WHEN 'thursday' THEN 4
               WHEN 'friday' THEN 5
               WHEN 'saturday' THEN 6
             END
        THEN local_date + (
          CASE LOWER(ds.day_of_week)
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
          7 + CASE LOWER(ds.day_of_week)
            WHEN 'sunday' THEN 0
            WHEN 'monday' THEN 1
            WHEN 'tuesday' THEN 2
            WHEN 'wednesday' THEN 3
            WHEN 'thursday' THEN 4
            WHEN 'friday' THEN 5
            WHEN 'saturday' THEN 6
          END - local_dow
        )::INTEGER
      END as initial_next_date
    FROM delivery_schedules ds
    WHERE ds.is_active = true
  ),
  adjusted_dates AS (
    SELECT
      ud.schedule_id,
      ud.day_of_week,
      ud.cutoff_days_before,
      ud.max_orders,
      ud.is_active,
      -- If the initial next date is past cutoff, add 7 days to get the following week
      CASE
        WHEN ud.initial_next_date - COALESCE(ud.cutoff_days_before, 0) < local_date
        THEN ud.initial_next_date + 7
        ELSE ud.initial_next_date
      END as next_delivery_date
    FROM upcoming_dates ud
  ),
  dates_with_counts AS (
    SELECT 
      ad.schedule_id,
      ad.day_of_week,
      ad.cutoff_days_before,
      ad.max_orders,
      ad.is_active,
      ad.next_delivery_date,
      -- Count orders for THIS SPECIFIC DATE
      COUNT(o.id) as orders_count
    FROM adjusted_dates ad
    LEFT JOIN orders o ON 
      o.delivery_date = ad.next_delivery_date
      AND o.status NOT IN ('cancelled')
    GROUP BY 
      ad.schedule_id, 
      ad.day_of_week, 
      ad.cutoff_days_before, 
      ad.max_orders, 
      ad.is_active,
      ad.next_delivery_date
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
