-- Tracks whether the latest row highlight was dismissed (double-click in CRM table)
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS latest_row_acknowledged BOOLEAN DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS latest_row_acknowledged BOOLEAN DEFAULT false;
ALTER TABLE public.callback_requests ADD COLUMN IF NOT EXISTS latest_row_acknowledged BOOLEAN DEFAULT false;
ALTER TABLE public.contact_requests ADD COLUMN IF NOT EXISTS latest_row_acknowledged BOOLEAN DEFAULT false;
ALTER TABLE public.career_applications ADD COLUMN IF NOT EXISTS latest_row_acknowledged BOOLEAN DEFAULT false;
ALTER TABLE public.enterprise_requests ADD COLUMN IF NOT EXISTS latest_row_acknowledged BOOLEAN DEFAULT false;
ALTER TABLE public.pilot_requests ADD COLUMN IF NOT EXISTS latest_row_acknowledged BOOLEAN DEFAULT false;
ALTER TABLE public.drone_pilot_registrations ADD COLUMN IF NOT EXISTS latest_row_acknowledged BOOLEAN DEFAULT false;
ALTER TABLE public.for_businesses ADD COLUMN IF NOT EXISTS latest_row_acknowledged BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS latest_row_acknowledged BOOLEAN DEFAULT false;
