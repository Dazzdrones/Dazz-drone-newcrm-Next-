"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRbacDbClient } from "@/lib/supabase/rbac-db";
import { createSessionClient } from "@/lib/supabase/session";
import { requirePermission, requireAuth } from "@/lib/auth/permissions";

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export interface CrmUserRow {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  role_key: string;
  role_name: string;
}

export async function listCrmUsers(): Promise<CrmUserRow[]> {
  await requirePermission("admin_users:manage");

  const supabase = await createRbacDbClient();
  const { data, error } = await supabase
    .from("crm_profiles")
    .select(
      `
      id,
      email,
      full_name,
      is_active,
      created_at,
      role:crm_roles ( key, name )
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const role = Array.isArray(row.role) ? row.role[0] : row.role;
    return {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      is_active: row.is_active,
      created_at: row.created_at,
      role_key: role?.key ?? "unknown",
      role_name: role?.name ?? "Unknown",
    };
  });
}

export async function listCrmRoles() {
  await requirePermission("admin_users:manage");

  const supabase = await createRbacDbClient();
  const { data, error } = await supabase
    .from("crm_roles")
    .select("id, key, name, is_system")
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCrmUser(input: {
  email: string;
  password: string;
  full_name: string;
  role_id: string;
}) {
  const session = await requirePermission("admin_users:manage");
  const admin = createAdminClient();
  const supabase = await createRbacDbClient();

  const { data: role, error: roleError } = await supabase
    .from("crm_roles")
    .select("key")
    .eq("id", input.role_id)
    .single();

  if (roleError || !role) throw new Error("Invalid role selected");

  if (role.key === "super_admin" && !session.isSuperAdmin) {
    throw new Error("Only super admins can create super admin accounts");
  }

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email: input.email.trim(),
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.full_name.trim() },
    });

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "Failed to create auth user");
  }

  const { error: profileError } = await supabase.from("crm_profiles").insert({
    id: authData.user.id,
    email: input.email.trim(),
    full_name: input.full_name.trim(),
    role_id: input.role_id,
    is_active: true,
    created_by: session.userId,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    throw new Error(profileError.message);
  }

  await supabase.from("crm_audit_logs").insert({
    actor_id: session.userId,
    action: "user.created",
    resource_type: "crm_profile",
    resource_id: authData.user.id,
    metadata: { email: input.email, role_key: role.key },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateCrmUser(
  userId: string,
  updates: {
    full_name?: string;
    role_id?: string;
    is_active?: boolean;
  }
) {
  const session = await requirePermission("admin_users:manage");
  const supabase = await createRbacDbClient();

  if (updates.role_id) {
    const { data: role } = await supabase
      .from("crm_roles")
      .select("key")
      .eq("id", updates.role_id)
      .single();

    if (role?.key === "super_admin" && !session.isSuperAdmin) {
      throw new Error("Only super admins can assign the super admin role");
    }
  }

  const { error } = await supabase
    .from("crm_profiles")
    .update(updates)
    .eq("id", userId);

  if (error) throw new Error(error.message);

  await supabase.from("crm_audit_logs").insert({
    actor_id: session.userId,
    action: "user.updated",
    resource_type: "crm_profile",
    resource_id: userId,
    metadata: updates,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteCrmUser(userId: string) {
  const session = await requirePermission("admin_users:manage");

  if (userId === session.userId) {
    throw new Error("You cannot delete your own account");
  }

  const supabase = await createRbacDbClient();
  const admin = createAdminClient();

  const { data: profile, error: fetchError } = await supabase
    .from("crm_profiles")
    .select("id, email, role:crm_roles ( key )")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) {
    throw new Error("User not found");
  }

  const role = Array.isArray(profile.role) ? profile.role[0] : profile.role;

  if (role?.key === "super_admin") {
    throw new Error("Super admin accounts cannot be deleted");
  }

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) throw new Error(authError.message);

  await supabase.from("crm_audit_logs").insert({
    actor_id: session.userId,
    action: "user.deleted",
    resource_type: "crm_profile",
    resource_id: userId,
    metadata: { email: profile.email, role_key: role?.key },
  });

  revalidatePath("/admin/users");
  revalidatePath("/", "layout");
  return { success: true };
}
