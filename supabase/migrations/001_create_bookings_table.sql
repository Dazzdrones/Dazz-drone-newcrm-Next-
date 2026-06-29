-- Run this in your Supabase SQL Editor to create the bookings table
-- for converted booking requests

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_request_id UUID REFERENCES public.booking_requests(id),
  customer_name TEXT,
  email TEXT,
  phone TEXT,
  service_type TEXT,
  location TEXT,
  preferred_date TIMESTAMPTZ,
  confirmed_date TIMESTAMPTZ,
  notes TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'in_progress', 'completed', 'cancelled')),
  assigned_pilot TEXT,
  price NUMERIC(10, 2),
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and CRM policies (002 migration handles other tables; bookings gets policies here too)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRM read bookings" ON public.bookings;
DROP POLICY IF EXISTS "CRM write bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.bookings;
CREATE POLICY "CRM read bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "CRM write bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_request_id ON public.bookings(booking_request_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Add status column to booking_requests if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_requests' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.booking_requests
    ADD COLUMN status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'converted', 'rejected', 'cancelled'));
  END IF;
END $$;
