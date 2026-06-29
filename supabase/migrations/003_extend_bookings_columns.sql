-- Extends bookings table to store full booking request data on conversion

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS official_mail TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS shoot_category TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS selected_drone TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pin_zip_code TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_datetime TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_duration TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reason_for_booking TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS privacy_policy_accepted BOOLEAN;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS terms_conditions_accepted BOOLEAN;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS raw_submission JSONB;

-- If booking_datetime was previously created as timestamptz, convert to text
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'booking_datetime'
      AND data_type = 'timestamp with time zone'
  ) THEN
    ALTER TABLE public.bookings
    ALTER COLUMN booking_datetime TYPE TEXT
    USING booking_datetime::text;
  END IF;
END $$;

-- Backfill from linked booking requests
UPDATE public.bookings b SET
  full_name = r.full_name,
  official_mail = r.official_mail,
  phone_number = r.phone_number,
  shoot_category = r.shoot_category,
  selected_drone = r.selected_drone,
  location_name = r.location_name,
  address = r.address,
  pin_zip_code = r.pin_zip_code,
  booking_datetime = r.booking_datetime::text,
  booking_duration = r.booking_duration,
  reason_for_booking = r.reason_for_booking,
  privacy_policy_accepted = r.privacy_policy_accepted,
  terms_conditions_accepted = r.terms_conditions_accepted,
  raw_submission = r.raw_submission,
  price = COALESCE(b.price, r.price),
  currency = COALESCE(b.currency, r.currency),
  customer_name = COALESCE(b.customer_name, r.full_name),
  email = COALESCE(b.email, r.official_mail),
  phone = COALESCE(b.phone, r.phone_number),
  service_type = COALESCE(b.service_type, r.shoot_category),
  location = COALESCE(b.location, r.location_name),
  preferred_date = COALESCE(
    b.preferred_date,
    CASE
      WHEN r.booking_datetime ~ '^\d{4}-\d{2}-\d{2}'
      THEN r.booking_datetime::timestamptz
      ELSE NULL
    END
  ),
  notes = COALESCE(b.notes, r.reason_for_booking)
FROM public.booking_requests r
WHERE b.booking_request_id = r.id;

-- Backfill legacy columns from new columns where still empty
UPDATE public.bookings SET
  customer_name = COALESCE(customer_name, full_name),
  email = COALESCE(email, official_mail),
  phone = COALESCE(phone, phone_number),
  service_type = COALESCE(service_type, shoot_category),
  location = COALESCE(location, location_name),
  preferred_date = COALESCE(
    preferred_date,
    CASE
      WHEN booking_datetime ~ '^\d{4}-\d{2}-\d{2}'
      THEN booking_datetime::timestamptz
      ELSE NULL
    END
  ),
  notes = COALESCE(notes, reason_for_booking)
WHERE booking_request_id IS NOT NULL;
