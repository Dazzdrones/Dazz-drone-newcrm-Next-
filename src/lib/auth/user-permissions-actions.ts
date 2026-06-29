"use server";

import { revalidatePath } from "next/cache";
import { createRbacDbClient } from "@/lib/supabase/rbac-db";
import { requirePermission } from "@/lib/auth/permissions";

export type PermissionOverrideState = "inherit" | "grant" | "deny";

export interface UserPermissionDetails {
  userId: string;
  email: string;
  fullName: string | null;
  roleKey: string;
  roleName: string;
  rolePermissions: string[];
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
      role_id,
      role:crm_roles ( key, name )
    `
    )
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error("User not found");
  }

  const role = Array.isArray(profile.role) ? profile.role[0] : profile.role;

  const { data: rolePerms } = await supabase
    .from("crm_role_permissions")
    .select("permission:crm_permissions ( key )")
    .eq("role_id", profile.role_id);

  const rolePermissionKeys = (rolePerms ?? [])
    .map((row) => {
      const perm = Array.isArray(row.permission)
        ? row.permission[0]
        : row.permission;
      return perm?.key as string | undefined;
    })
    .filter(Boolean) as string[];

  const { data: overrideRows } = await supabase
    .from("crm_user_permission_overrides")
    .select("permission_key, granted")
    .eq("user_id", userId);

  const overrides: Record<string, "grant" | "deny"> = {};
  for (const row of overrideRows ?? []) {
    overrides[row.permission_key] = row.granted ? "grant" : "deny";
  }

  const { data: effectiveRows } = await supabase.rpc("crm_user_permissions", {
    target_user_id: userId,
  });

  const effectivePermissions = (effectiveRows ?? []).map(
    (row: { permission_key: string }) => row.permission_key
  );

  return {
    userId,
    email: profile.email,
    fullName: profile.full_name,
    roleKey: role?.key ?? "unknown",
    roleName: role?.name ?? "Unknown",
    rolePermissions: rolePermissionKeys,
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
