import { createSessionClient } from "@/lib/supabase/session";
import { createRbacDbClient } from "@/lib/supabase/rbac-db";
import type { AuthSession, CrmProfile, CrmRole } from "./types";

export async function getAuthUser() {
  const supabase = await createSessionClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function getCrmProfile(userId: string): Promise<CrmProfile | null> {
  const supabase = await createSessionClient();

  const { data, error } = await supabase
    .from("crm_profiles")
    .select(
      `
      id,
      email,
      full_name,
      role_id,
      is_active,
      avatar_url,
      role:crm_roles (
        id,
        key,
        name,
        description,
        is_system
      )
    `
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;

  const role = Array.isArray(data.role) ? data.role[0] : data.role;

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    role_id: data.role_id,
    is_active: data.is_active,
    avatar_url: data.avatar_url,
    role: role as CrmRole | undefined,
  };
}

async function getRolePermissions(userId: string): Promise<string[]> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("crm_user_permissions", {
    target_user_id: userId,
  });

  if (error || !data) return [];
  return (data as { permission_key: string }[]).map((row) => row.permission_key);
}

async function getTeamPermissions(userId: string): Promise<string[]> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? await createRbacDbClient()
    : await createSessionClient();

  const { data, error } = await supabase
    .from("crm_team_members")
    .select(
      `
      team:crm_teams!inner (
        is_active,
        access:crm_team_module_access (
          module_key,
          can_read,
          can_write
        )
      )
    `
    )
    .eq("user_id", userId);

  if (error || !data) return [];

  const perms = new Set<string>();

  for (const row of data) {
    const team = Array.isArray(row.team) ? row.team[0] : row.team;
    if (!team?.is_active) continue;

    const accessList = Array.isArray(team.access) ? team.access : [team.access];
    for (const a of accessList) {
      if (!a) continue;
      if (a.can_read) perms.add(`${a.module_key}:read`);
      if (a.can_write) {
        perms.add(`${a.module_key}:write`);
        if (a.module_key === "bookings") perms.add("bookings:create");
        if (a.module_key === "booking_requests") {
          perms.add("booking_requests:convert");
        }
      }
    }
  }

  return [...perms];
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const [rolePerms, teamPerms] = await Promise.all([
    getRolePermissions(userId),
    getTeamPermissions(userId),
  ]);
  return [...new Set([...rolePerms, ...teamPerms])];
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const profile = await getCrmProfile(user.id);
  if (!profile) return null;

  const permissions = await getUserPermissions(user.id);
  const isSuperAdmin = profile.role?.key === "super_admin";

  return {
    userId: user.id,
    email: user.email ?? profile.email,
    profile,
    permissions,
    isSuperAdmin,
  };
}
