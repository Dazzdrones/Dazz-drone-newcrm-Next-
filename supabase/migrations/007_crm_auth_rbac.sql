-- =============================================================================
-- CRM RBAC: roles, permissions, teams, modules, profiles, audit log
-- Run in Supabase SQL Editor after migrations 001–006
--
-- After running:
--   1. Enable Email auth in Supabase Dashboard → Authentication → Providers
--   2. Create your account via Auth (sign up) or Dashboard → Authentication → Users
--   3. Run the bootstrap block at the bottom with your email
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Roles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. Permissions catalog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  module_key TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. Role ↔ Permission
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_role_permissions (
  role_id UUID NOT NULL REFERENCES public.crm_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.crm_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ---------------------------------------------------------------------------
-- 4. Modules registry (sidebar / feature flags)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  route TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5. CRM profiles (staff — linked to auth.users, NOT public.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role_id UUID NOT NULL REFERENCES public.crm_roles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_profiles_role_id ON public.crm_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_crm_profiles_email ON public.crm_profiles(email);
CREATE INDEX IF NOT EXISTS idx_crm_profiles_is_active ON public.crm_profiles(is_active);

-- ---------------------------------------------------------------------------
-- 6. Teams
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- 7. Team membership
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_team_members (
  team_id UUID NOT NULL REFERENCES public.crm_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_role TEXT NOT NULL DEFAULT 'member' CHECK (team_role IN ('lead', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_team_members_user_id ON public.crm_team_members(user_id);

-- ---------------------------------------------------------------------------
-- 8. Team module access
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_team_module_access (
  team_id UUID NOT NULL REFERENCES public.crm_teams(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL REFERENCES public.crm_modules(key) ON DELETE CASCADE,
  can_read BOOLEAN NOT NULL DEFAULT true,
  can_write BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (team_id, module_key)
);

-- ---------------------------------------------------------------------------
-- 9. Per-user permission overrides (grant or explicit deny)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_user_permission_overrides (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, permission_key)
);

-- ---------------------------------------------------------------------------
-- 10. Audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_actor_id ON public.crm_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_created_at ON public.crm_audit_logs(created_at DESC);

-- ---------------------------------------------------------------------------
-- SEED: System roles
-- ---------------------------------------------------------------------------
INSERT INTO public.crm_roles (key, name, description, is_system) VALUES
  ('super_admin', 'Super Admin', 'Full system access. Can manage users, teams, roles, and all modules.', true),
  ('admin',       'Admin',       'Operational admin. Can manage most data and users within scope.', true)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- SEED: Modules
-- ---------------------------------------------------------------------------
INSERT INTO public.crm_modules (key, name, route, icon, sort_order) VALUES
  ('dashboard',           'Dashboard',            '/',                        'LayoutDashboard',  10),
  ('bookings',            'Bookings',             '/bookings',                'CalendarCheck',    20),
  ('booking_requests',    'Booking Requests',     '/booking-requests',        'CalendarDays',     30),
  ('callback_requests',   'Callback Requests',    '/callback-requests',       'Phone',            40),
  ('contact_requests',    'Contact Requests',     '/contact-requests',        'Mail',             50),
  ('career_applications', 'Career Applications',  '/career-applications',     'Briefcase',        60),
  ('enterprise_requests', 'Enterprise Requests',  '/enterprise-requests',     'Building2',        70),
  ('legacy_data',         'Legacy Data',          NULL,                       'Archive',          80),
  ('admin_users',         'User Management',      '/admin/users',             'Users',            90),
  ('admin_teams',         'Team Management',      '/admin/teams',             'UsersRound',       100),
  ('admin_roles',         'Roles & Permissions',  '/admin/roles',             'Shield',           110),
  ('admin_modules',       'Module Settings',      '/admin/modules',           'Settings',         120),
  ('admin_audit',         'Audit Log',            '/admin/audit',             'ScrollText',       130)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- SEED: Permissions (module:action)
-- ---------------------------------------------------------------------------
INSERT INTO public.crm_permissions (key, module_key, action, description) VALUES
  -- dashboard
  ('dashboard:read',           'dashboard',           'read',    'View dashboard'),
  -- bookings
  ('bookings:read',            'bookings',            'read',    'View bookings'),
  ('bookings:write',           'bookings',            'write',   'Edit bookings'),
  ('bookings:create',          'bookings',            'create',  'Create manual bookings'),
  ('bookings:delete',          'bookings',            'delete',  'Delete bookings'),
  -- booking_requests
  ('booking_requests:read',    'booking_requests',    'read',    'View booking requests'),
  ('booking_requests:write',   'booking_requests',    'write',   'Edit booking requests'),
  ('booking_requests:convert', 'booking_requests',    'convert', 'Convert request to booking'),
  ('booking_requests:delete',  'booking_requests',    'delete',  'Delete booking requests'),
  -- callback_requests
  ('callback_requests:read',   'callback_requests',   'read',    'View callback requests'),
  ('callback_requests:write',  'callback_requests',   'write',   'Edit callback requests'),
  ('callback_requests:delete', 'callback_requests',   'delete',  'Delete callback requests'),
  -- contact_requests
  ('contact_requests:read',    'contact_requests',    'read',    'View contact requests'),
  ('contact_requests:write',   'contact_requests',    'write',   'Edit contact requests'),
  ('contact_requests:delete',  'contact_requests',    'delete',  'Delete contact requests'),
  -- career_applications
  ('career_applications:read',   'career_applications', 'read',   'View career applications'),
  ('career_applications:write',  'career_applications', 'write',  'Edit career applications'),
  ('career_applications:delete', 'career_applications', 'delete', 'Delete career applications'),
  -- enterprise_requests
  ('enterprise_requests:read',   'enterprise_requests', 'read',   'View enterprise requests'),
  ('enterprise_requests:write',  'enterprise_requests', 'write',  'Edit enterprise requests'),
  ('enterprise_requests:delete', 'enterprise_requests', 'delete', 'Delete enterprise requests'),
  -- legacy_data
  ('legacy_data:read',         'legacy_data',         'read',    'View legacy tables'),
  ('legacy_data:write',        'legacy_data',         'write',   'Edit legacy tables'),
  ('legacy_data:delete',       'legacy_data',         'delete',  'Delete legacy table records'),
  -- admin
  ('admin_users:manage',       'admin_users',         'manage',  'Create and manage CRM users'),
  ('admin_teams:manage',       'admin_teams',         'manage',  'Create and manage teams'),
  ('admin_roles:manage',       'admin_roles',         'manage',  'Manage roles and permissions'),
  ('admin_modules:manage',     'admin_modules',       'manage',  'Manage module settings'),
  ('admin_audit:read',         'admin_audit',         'read',    'View audit log')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- SEED: Role → Permission mappings
-- ---------------------------------------------------------------------------

-- super_admin: ALL permissions
INSERT INTO public.crm_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.crm_roles r
CROSS JOIN public.crm_permissions p
WHERE r.key = 'super_admin'
ON CONFLICT DO NOTHING;

-- admin: all operational + user/team admin (no role/module admin)
INSERT INTO public.crm_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.crm_roles r
JOIN public.crm_permissions p ON p.key IN (
  'dashboard:read',
  'bookings:read', 'bookings:write', 'bookings:create', 'bookings:delete',
  'booking_requests:read', 'booking_requests:write', 'booking_requests:convert', 'booking_requests:delete',
  'callback_requests:read', 'callback_requests:write', 'callback_requests:delete',
  'contact_requests:read', 'contact_requests:write', 'contact_requests:delete',
  'career_applications:read', 'career_applications:write', 'career_applications:delete',
  'enterprise_requests:read', 'enterprise_requests:write', 'enterprise_requests:delete',
  'legacy_data:read', 'legacy_data:delete',
  'admin_users:manage', 'admin_teams:manage', 'admin_audit:read'
)
WHERE r.key = 'admin'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- HELPER: Is the current user an active CRM staff member?
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.crm_profiles
    WHERE id = auth.uid()
      AND is_active = true
  );
$$;

-- ---------------------------------------------------------------------------
-- HELPER: Does the current user have a specific role key?
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_has_role(role_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.crm_profiles p
    JOIN public.crm_roles r ON r.id = p.role_id
    WHERE p.id = auth.uid()
      AND p.is_active = true
      AND r.key = role_key
  );
$$;

-- ---------------------------------------------------------------------------
-- HELPER: Is the current user a super admin?
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.crm_has_role('super_admin');
$$;

-- ---------------------------------------------------------------------------
-- HELPER: Effective permissions for a user (role + overrides)
-- Returns permission keys. Deny overrides remove grants.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_user_permissions(target_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (permission_key TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH role_perms AS (
    SELECT p.key AS permission_key
    FROM public.crm_profiles prof
    JOIN public.crm_role_permissions rp ON rp.role_id = prof.role_id
    JOIN public.crm_permissions p ON p.id = rp.permission_id
    WHERE prof.id = target_user_id
      AND prof.is_active = true
  ),
  grants AS (
    SELECT permission_key FROM role_perms
    UNION
    SELECT permission_key
    FROM public.crm_user_permission_overrides
    WHERE user_id = target_user_id AND granted = true
  ),
  denials AS (
    SELECT permission_key
    FROM public.crm_user_permission_overrides
    WHERE user_id = target_user_id AND granted = false
  )
  SELECT g.permission_key
  FROM grants g
  WHERE NOT EXISTS (
    SELECT 1 FROM denials d WHERE d.permission_key = g.permission_key
  );
$$;

-- ---------------------------------------------------------------------------
-- HELPER: Check single permission for current user
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_has_permission(perm_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.crm_user_permissions(auth.uid()) p
    WHERE p.permission_key = perm_key
  );
$$;

-- ---------------------------------------------------------------------------
-- HELPER: Can user read a module? (role permission OR team module access)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_can_access_module(mod_key TEXT, need_write BOOLEAN DEFAULT false)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.crm_is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.crm_user_permissions(auth.uid()) p
      WHERE p.permission_key LIKE mod_key || ':%'
    )
    OR EXISTS (
      SELECT 1
      FROM public.crm_team_members tm
      JOIN public.crm_team_module_access tma ON tma.team_id = tm.team_id
      WHERE tm.user_id = auth.uid()
        AND tma.module_key = mod_key
        AND (
          (NOT need_write AND tma.can_read = true)
          OR (need_write AND tma.can_write = true)
        )
    );
$$;

-- ---------------------------------------------------------------------------
-- TRIGGER: Keep crm_profiles.updated_at fresh
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_profiles_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_profiles_updated_at ON public.crm_profiles;
CREATE TRIGGER trg_crm_profiles_updated_at
  BEFORE UPDATE ON public.crm_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_profiles_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: Enable on all CRM RBAC tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.crm_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_team_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_user_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_audit_logs ENABLE ROW LEVEL SECURITY;

-- Staff can read roles, permissions, modules (for UI)
CREATE POLICY "crm_staff_read_roles" ON public.crm_roles
  FOR SELECT TO authenticated USING (public.crm_is_staff());

CREATE POLICY "crm_staff_read_permissions" ON public.crm_permissions
  FOR SELECT TO authenticated USING (public.crm_is_staff());

CREATE POLICY "crm_staff_read_role_permissions" ON public.crm_role_permissions
  FOR SELECT TO authenticated USING (public.crm_is_staff());

CREATE POLICY "crm_staff_read_modules" ON public.crm_modules
  FOR SELECT TO authenticated USING (public.crm_is_staff());

-- Profiles: staff read all; users read self; super_admin/admin manage
CREATE POLICY "crm_profiles_select" ON public.crm_profiles
  FOR SELECT TO authenticated
  USING (public.crm_is_staff());

CREATE POLICY "crm_profiles_update_self" ON public.crm_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "crm_profiles_admin_insert" ON public.crm_profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.crm_has_permission('admin_users:manage'));

CREATE POLICY "crm_profiles_admin_update" ON public.crm_profiles
  FOR UPDATE TO authenticated
  USING (public.crm_has_permission('admin_users:manage'));

CREATE POLICY "crm_profiles_admin_delete" ON public.crm_profiles
  FOR DELETE TO authenticated
  USING (public.crm_is_super_admin());

-- Teams
CREATE POLICY "crm_teams_select" ON public.crm_teams
  FOR SELECT TO authenticated USING (public.crm_is_staff());

CREATE POLICY "crm_teams_manage" ON public.crm_teams
  FOR ALL TO authenticated
  USING (public.crm_has_permission('admin_teams:manage'))
  WITH CHECK (public.crm_has_permission('admin_teams:manage'));

-- Team members
CREATE POLICY "crm_team_members_select" ON public.crm_team_members
  FOR SELECT TO authenticated USING (public.crm_is_staff());

CREATE POLICY "crm_team_members_manage" ON public.crm_team_members
  FOR ALL TO authenticated
  USING (public.crm_has_permission('admin_teams:manage'))
  WITH CHECK (public.crm_has_permission('admin_teams:manage'));

-- Team module access
CREATE POLICY "crm_team_module_access_select" ON public.crm_team_module_access
  FOR SELECT TO authenticated USING (public.crm_is_staff());

CREATE POLICY "crm_team_module_access_manage" ON public.crm_team_module_access
  FOR ALL TO authenticated
  USING (public.crm_has_permission('admin_teams:manage'))
  WITH CHECK (public.crm_has_permission('admin_teams:manage'));

-- Permission overrides
CREATE POLICY "crm_overrides_select" ON public.crm_user_permission_overrides
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.crm_has_permission('admin_users:manage')
  );

CREATE POLICY "crm_overrides_manage" ON public.crm_user_permission_overrides
  FOR ALL TO authenticated
  USING (public.crm_has_permission('admin_users:manage'))
  WITH CHECK (public.crm_has_permission('admin_users:manage'));

-- Roles/permissions admin (super_admin only for role edits)
CREATE POLICY "crm_roles_admin" ON public.crm_roles
  FOR ALL TO authenticated
  USING (public.crm_has_permission('admin_roles:manage'))
  WITH CHECK (public.crm_has_permission('admin_roles:manage'));

CREATE POLICY "crm_role_permissions_admin" ON public.crm_role_permissions
  FOR ALL TO authenticated
  USING (public.crm_has_permission('admin_roles:manage'))
  WITH CHECK (public.crm_has_permission('admin_roles:manage'));

CREATE POLICY "crm_modules_admin" ON public.crm_modules
  FOR ALL TO authenticated
  USING (public.crm_has_permission('admin_modules:manage'))
  WITH CHECK (public.crm_has_permission('admin_modules:manage'));

-- Audit log
CREATE POLICY "crm_audit_read" ON public.crm_audit_logs
  FOR SELECT TO authenticated
  USING (public.crm_has_permission('admin_audit:read'));

CREATE POLICY "crm_audit_insert" ON public.crm_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.crm_is_staff());

