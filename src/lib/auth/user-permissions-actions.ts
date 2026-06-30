"use server";

import { revalidatePath } from "next/cache";
import { createRbacDbClient } from "@/lib/supabase/rbac-db";
import { requirePermission } from "@/lib/auth/permissions";
import {
  fetchRolePermissionsForUser,
  fetchTeamPermissionsForUser,
  fetchUserPermissionOverrides,
  mergeEffectivePermissions,
} from "@/lib/auth/permission-resolution";

export type PermissionOverrideState = "inherit" | "grant" | "deny";

export interface UserPermissionDetails {
  userId: string;
  email: string;
  fullName: string | null;
  roleKey: string;
  roleName: string;
  rolePermissions: string[];
  teamPermissions: string[];
  overrides: Record<string, "grant" | "deny">;
  effectivePermissions: string[];
}

export async function getUserPermissionDetails(
  userId: string
): Promise<UserPermissionDetails> {
  await requirePermission("admin_users:manage");
  const supabase = await createRbacDbClient();

  const { data: profile, error: profileError } = await supabase
    .from("crm_profiles")
    .select(
      `
      id,
      email,
      full_name,
      role:crm_roles ( key, name )
    `
    )
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error("User not found");
  }

  const role = Array.isArray(profile.role) ? profile.role[0] : profile.role;

  const [rolePermissions, teamPermissions, overrideRows] = await Promise.all([
    fetchRolePermissionsForUser(userId, supabase),
    fetchTeamPermissionsForUser(userId, supabase),
    fetchUserPermissionOverrides(userId, supabase),
  ]);

  const overrides: Record<string, "grant" | "deny"> = {};
  for (const row of overrideRows) {
    overrides[row.permission_key] = row.granted ? "grant" : "deny";
  }

  const effectivePermissions = mergeEffectivePermissions(
    rolePermissions,
    teamPermissions,
    overrideRows
  );

  return {
    userId,
    email: profile.email,
    fullName: profile.full_name,
    roleKey: role?.key ?? "unknown",
    roleName: role?.name ?? "Unknown",
    rolePermissions,
    teamPermissions,
    overrides,
    effectivePermissions,
  };
}

export async function saveUserPermissionOverrides(
  userId: string,
  states: Record<string, PermissionOverrideState>
) {
  const session = await requirePermission("admin_users:manage");
  const supabase = await createRbacDbClient();

  const { data: profile } = await supabase
    .from("crm_profiles")
    .select("role:crm_roles ( key )")
    .eq("id", userId)
    .single();

  const role = Array.isArray(profile?.role) ? profile.role[0] : profile?.role;
  if (role?.key === "super_admin") {
    throw new Error("Super admin permissions cannot be customized");
  }

  const { error: deleteError } = await supabase
    .from("crm_user_permission_overrides")
    .delete()
    .eq("user_id", userId);

  if (deleteError) throw new Error(deleteError.message);

  const rows = Object.entries(states)
    .filter(([, state]) => state !== "inherit")
    .map(([permission_key, state]) => ({
      user_id: userId,
      permission_key,
      granted: state === "grant",
      created_by: session.userId,
    }));

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("crm_user_permission_overrides")
      .insert(rows);

    if (insertError) throw new Error(insertError.message);
  }

  await supabase.from("crm_audit_logs").insert({
    actor_id: session.userId,
    action: "user.permissions_updated",
    resource_type: "crm_profile",
    resource_id: userId,
    metadata: {
      override_count: rows.length,
      grants: rows.filter((r) => r.granted).map((r) => r.permission_key),
      denials: rows.filter((r) => !r.granted).map((r) => r.permission_key),
    },
  });

  revalidatePath("/admin/users");
  revalidatePath("/", "layout");
  return { success: true };
}
