-- Grant delete permissions to the admin role for operational CRM tables.

INSERT INTO public.crm_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.crm_roles r
JOIN public.crm_permissions p ON p.key IN (
  'bookings:delete',
  'booking_requests:delete',
  'callback_requests:delete',
  'contact_requests:delete',
  'career_applications:delete',
  'enterprise_requests:delete'
)
WHERE r.key = 'admin'
ON CONFLICT DO NOTHING;
