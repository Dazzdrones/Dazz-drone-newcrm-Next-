-- Run this in Supabase SQL Editor if data shows as empty (RLS blocking access)
-- Option A: Use this if you want the publishable/anon key to read & manage CRM data

-- booking_requests
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRM read booking_requests" ON public.booking_requests;
DROP POLICY IF EXISTS "CRM write booking_requests" ON public.booking_requests;
CREATE POLICY "CRM read booking_requests" ON public.booking_requests FOR SELECT USING (true);
CREATE POLICY "CRM write booking_requests" ON public.booking_requests FOR ALL USING (true) WITH CHECK (true);

-- callback_requests
ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRM read callback_requests" ON public.callback_requests;
DROP POLICY IF EXISTS "CRM write callback_requests" ON public.callback_requests;
CREATE POLICY "CRM read callback_requests" ON public.callback_requests FOR SELECT USING (true);
CREATE POLICY "CRM write callback_requests" ON public.callback_requests FOR ALL USING (true) WITH CHECK (true);

-- contact_requests
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRM read contact_requests" ON public.contact_requests;
DROP POLICY IF EXISTS "CRM write contact_requests" ON public.contact_requests;
CREATE POLICY "CRM read contact_requests" ON public.contact_requests FOR SELECT USING (true);
CREATE POLICY "CRM write contact_requests" ON public.contact_requests FOR ALL USING (true) WITH CHECK (true);

-- career_applications
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRM read career_applications" ON public.career_applications;
DROP POLICY IF EXISTS "CRM write career_applications" ON public.career_applications;
CREATE POLICY "CRM read career_applications" ON public.career_applications FOR SELECT USING (true);
CREATE POLICY "CRM write career_applications" ON public.career_applications FOR ALL USING (true) WITH CHECK (true);

-- enterprise_requests
ALTER TABLE public.enterprise_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRM read enterprise_requests" ON public.enterprise_requests;
DROP POLICY IF EXISTS "CRM write enterprise_requests" ON public.enterprise_requests;
CREATE POLICY "CRM read enterprise_requests" ON public.enterprise_requests FOR SELECT USING (true);
CREATE POLICY "CRM write enterprise_requests" ON public.enterprise_requests FOR ALL USING (true) WITH CHECK (true);

-- pilot_requests
ALTER TABLE public.pilot_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRM read pilot_requests" ON public.pilot_requests;
DROP POLICY IF EXISTS "CRM write pilot_requests" ON public.pilot_requests;
CREATE POLICY "CRM read pilot_requests" ON public.pilot_requests FOR SELECT USING (true);
CREATE POLICY "CRM write pilot_requests" ON public.pilot_requests FOR ALL USING (true) WITH CHECK (true);

-- drone_pilot_registrations
ALTER TABLE public.drone_pilot_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRM read drone_pilot_registrations" ON public.drone_pilot_registrations;
DROP POLICY IF EXISTS "CRM write drone_pilot_registrations" ON public.drone_pilot_registrations;
CREATE POLICY "CRM read drone_pilot_registrations" ON public.drone_pilot_registrations FOR SELECT USING (true);
CREATE POLICY "CRM write drone_pilot_registrations" ON public.drone_pilot_registrations FOR ALL USING (true) WITH CHECK (true);

-- for_businesses
ALTER TABLE public.for_businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRM read for_businesses" ON public.for_businesses;
DROP POLICY IF EXISTS "CRM write for_businesses" ON public.for_businesses;
CREATE POLICY "CRM read for_businesses" ON public.for_businesses FOR SELECT USING (true);
CREATE POLICY "CRM write for_businesses" ON public.for_businesses FOR ALL USING (true) WITH CHECK (true);

-- users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRM read users" ON public.users;
DROP POLICY IF EXISTS "CRM write users" ON public.users;
CREATE POLICY "CRM read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "CRM write users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- bookings (optional — only if table exists; create it first with 001_create_bookings_table.sql)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bookings'
  ) THEN
    ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "CRM read bookings" ON public.bookings;
    DROP POLICY IF EXISTS "CRM write bookings" ON public.bookings;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.bookings;
    CREATE POLICY "CRM read bookings" ON public.bookings FOR SELECT USING (true);
    CREATE POLICY "CRM write bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
