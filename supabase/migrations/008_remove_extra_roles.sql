-- Keep only super_admin and admin roles.
-- Reassigns any users on removed roles to admin, then deletes the extra roles.

UPDATE public.crm_profiles p
SET role_id = (SELECT id FROM public.crm_roles WHERE key = 'admin')
WHERE p.role_id IN (
  SELECT id FROM public.crm_roles WHERE key NOT IN ('super_admin', 'admin')
);

DELETE FROM public.crm_roles
WHERE key NOT IN ('super_admin', 'admin');
