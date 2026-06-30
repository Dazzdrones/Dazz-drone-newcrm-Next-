import type { SupabaseClient } from "@supabase/supabase-js";

export interface PermissionOverrideRow {
  permission_key: string;
  granted: boolean;
}

/** Merge role + team permissions, then apply user grant/deny overrides. */
export function mergeEffectivePermissions(
  rolePermissions: string[],
  teamPermissions: string[],
  overrides: PermissionOverrideRow[]
): string[] {
  const extraGrants = overrides
    .filter((o) => o.granted)
    .map((o) => o.permission_key);
  const denials = new Set(
    overrides.filter((o) => !o.granted).map((o) => o.permission_key)
  );

  const merged = new Set([
    ...rolePermissions,
    ...teamPermissions,
    ...extraGrants,
  ]);

  for (const key of denials) {
    merged.delete(key);
  }

  return [...merged];
}

export async function fetchTeamPermissionsForUser(
  userId: string,
  supabase: SupabaseClient
): Promise<string[]> {
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
    for (const access of accessList) {
      if (!access) continue;
      if (access.can_read) perms.add(`${access.module_key}:read`);
      if (access.can_write) {
        perms.add(`${access.module_key}:write`);
        if (access.module_key === "bookings") perms.add("bookings:create");
        if (access.module_key === "booking_requests") {
          perms.add("booking_requests:convert");
        }
      }
    }
  }

  return [...perms];
}

export async function fetchRolePermissionsForUser(
  userId: string,
  supabase: SupabaseClient
): Promise<string[]> {
  const { data: profile } = await supabase
    .from("crm_profiles")
    .select("role_id")
    .eq("id", userId)
    .single();

  if (!profile?.role_id) return [];

  const { data: rolePerms } = await supabase
    .from("crm_role_permissions")
    .select("permission:crm_permissions ( key )")
    .eq("role_id", profile.role_id);

  return (rolePerms ?? [])
    .map((row) => {
      const perm = Array.isArray(row.permission)
        ? row.permission[0]
        : row.permission;
      return perm?.key as string | undefined;
    })
    .filter(Boolean) as string[];
}

export async function fetchUserPermissionOverrides(
  userId: string,
  supabase: SupabaseClient
): Promise<PermissionOverrideRow[]> {
  const { data } = await supabase
    .from("crm_user_permission_overrides")
    .select("permission_key, granted")
    .eq("user_id", userId);

  return data ?? [];
}
