-- Grant legacy delete permission to admin role.

INSERT INTO public.crm_permissions (key, module_key, action, description) VALUES
  ('legacy_data:delete', 'legacy_data', 'delete', 'Delete legacy table records')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.crm_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.crm_roles r
JOIN public.crm_permissions p ON p.key = 'legacy_data:delete'
WHERE r.key = 'admin'
ON CONFLICT DO NOTHING;
