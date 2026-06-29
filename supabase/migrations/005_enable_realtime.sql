-- Enable Supabase Realtime for request tables (instant sidebar/table updates)
-- Run in Supabase SQL Editor after 004_add_crm_seen_column.sql

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'booking_requests',
    'callback_requests',
    'contact_requests',
    'career_applications',
    'enterprise_requests'
  ]
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',
        tbl
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;
