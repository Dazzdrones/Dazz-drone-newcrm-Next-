-- Hidden CRM field: tracks whether an admin has viewed the entry.
-- crm_seen = false → new (shows sidebar bubble + table highlight)
-- crm_seen = true  → seen

ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS crm_seen BOOLEAN DEFAULT false;
ALTER TABLE public.callback_requests ADD COLUMN IF NOT EXISTS crm_seen BOOLEAN DEFAULT false;
ALTER TABLE public.contact_requests ADD COLUMN IF NOT EXISTS crm_seen BOOLEAN DEFAULT false;
ALTER TABLE public.career_applications ADD COLUMN IF NOT EXISTS crm_seen BOOLEAN DEFAULT false;
ALTER TABLE public.enterprise_requests ADD COLUMN IF NOT EXISTS crm_seen BOOLEAN DEFAULT false;

-- Mark existing records as already seen
UPDATE public.booking_requests SET crm_seen = true WHERE crm_seen IS NOT true;
UPDATE public.callback_requests SET crm_seen = true WHERE crm_seen IS NOT true;
UPDATE public.contact_requests SET crm_seen = true WHERE crm_seen IS NOT true;
UPDATE public.career_applications SET crm_seen = true WHERE crm_seen IS NOT true;
UPDATE public.enterprise_requests SET crm_seen = true WHERE crm_seen IS NOT true;
