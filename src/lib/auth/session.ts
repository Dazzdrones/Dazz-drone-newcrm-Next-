import { cache } from "react";
import { createSessionClient } from "@/lib/supabase/session";
import { createRbacDbClient } from "@/lib/supabase/rbac-db";
import type { AuthSession, CrmProfile, CrmRole } from "./types";
import {
  fetchRolePermissionsForRoleId,
  fetchTeamPermissionsForUser,
  fetchUserPermissionOverrides,
  mergeEffectivePermissions,
} from "./permission-resolution";

export const getAuthUser = cache(async () => {
  const supabase = await createSessionClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
});

export const getCrmProfile = cache(
  async (userId: string): Promise<CrmProfile | null> => {
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
);

export const getUserPermissions = cache(
  async (userId: string, roleId: string): Promise<string[]> => {
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createRbacDbClient()
      : await createSessionClient();

    const [rolePermissions, teamPermissions, overrides] = await Promise.all([
      fetchRolePermissionsForRoleId(roleId, supabase),
      fetchTeamPermissionsForUser(userId, supabase),
      fetchUserPermissionOverrides(userId, supabase),
    ]);

    return mergeEffectivePermissions(
      rolePermissions,
      teamPermissions,
      overrides
    );
  }
);

/** One session load per request — deduped across layout, pages, and actions */
export const getAuthSession = cache(async (): Promise<AuthSession | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const profile = await getCrmProfile(user.id);
  if (!profile) return null;

  const permissions = await getUserPermissions(user.id, profile.role_id);
  const isSuperAdmin = profile.role?.key === "super_admin";

  return {
    userId: user.id,
    email: user.email ?? profile.email,
    profile,
    permissions,
    isSuperAdmin,
  };
});
