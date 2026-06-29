"use server";

import { revalidatePath } from "next/cache";
import { createRbacDbClient } from "@/lib/supabase/rbac-db";
import { requirePermission, requireAuth, hasPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function requireRolesOrUsersAdmin() {
  const session = await requireAuth();
  if (
    !hasPermission(session, "admin_roles:manage") &&
    !hasPermission(session, "admin_users:manage")
  ) {
    redirect("/forbidden");
  }
  return session;
}

async function audit(
  actorId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: Record<string, unknown>
) {
  const supabase = await createRbacDbClient();
  await supabase.from("crm_audit_logs").insert({
    actor_id: actorId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
  });
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export interface CrmTeamRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  member_count: number;
}

export async function listCrmTeams(): Promise<CrmTeamRow[]> {
  await requirePermission("admin_teams:manage");
  const supabase = await createRbacDbClient();

  const { data: teams, error } = await supabase
    .from("crm_teams")
    .select("id, name, slug, description, is_active, created_at")
    .order("name");

  if (error) throw new Error(error.message);

  const { data: members } = await supabase
    .from("crm_team_members")
    .select("team_id");

  const counts = (members ?? []).reduce<Record<string, number>>((acc, m) => {
    acc[m.team_id] = (acc[m.team_id] ?? 0) + 1;
    return acc;
  }, {});

  return (teams ?? []).map((t) => ({
    ...t,
    member_count: counts[t.id] ?? 0,
  }));
}

export async function createCrmTeam(input: {
  name: string;
  description?: string;
}) {
  const session = await requirePermission("admin_teams:manage");
  const supabase = await createRbacDbClient();
  const slug = slugify(input.name);

  const { data, error } = await supabase
    .from("crm_teams")
    .insert({
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await audit(session.userId, "team.created", "crm_team", data.id, {
    name: input.name,
  });
  revalidatePath("/admin/teams");
  return { success: true, id: data.id };
}

export async function updateCrmTeam(
  teamId: string,
  updates: { name?: string; description?: string; is_active?: boolean }
) {
  const session = await requirePermission("admin_teams:manage");
  const supabase = await createRbacDbClient();

  const payload: Record<string, unknown> = { ...updates };
  if (updates.name) payload.slug = slugify(updates.name);

  const { error } = await supabase
    .from("crm_teams")
    .update(payload)
    .eq("id", teamId);

  if (error) throw new Error(error.message);

  await audit(session.userId, "team.updated", "crm_team", teamId, updates);
  revalidatePath("/admin/teams");
  return { success: true };
}

export interface TeamMemberRow {
  user_id: string;
  team_role: string;
  email: string;
  full_name: string | null;
}

export async function listTeamMembers(teamId: string): Promise<TeamMemberRow[]> {
  await requirePermission("admin_teams:manage");
  const supabase = await createRbacDbClient();

  const { data, error } = await supabase
    .from("crm_team_members")
    .select("user_id, team_role")
    .eq("team_id", teamId);

  if (error) throw new Error(error.message);
  if (!data?.length) return [];

  const userIds = data.map((row) => row.user_id);
  const { data: profiles } = await supabase
    .from("crm_profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p])
  );

  return data.map((row) => ({
    user_id: row.user_id,
    team_role: row.team_role,
    email: profileMap[row.user_id]?.email ?? "",
    full_name: profileMap[row.user_id]?.full_name ?? null,
  }));
}

export async function addTeamMember(
  teamId: string,
  userId: string,
  teamRole: "lead" | "member" = "member"
) {
  const session = await requirePermission("admin_teams:manage");
  const supabase = await createRbacDbClient();

  const { error } = await supabase.from("crm_team_members").upsert({
    team_id: teamId,
    user_id: userId,
    team_role: teamRole,
  });

  if (error) throw new Error(error.message);

  await audit(session.userId, "team.member_added", "crm_team", teamId, {
    user_id: userId,
    team_role: teamRole,
  });
  revalidatePath("/admin/teams");
  return { success: true };
}

export async function removeTeamMember(teamId: string, userId: string) {
  const session = await requirePermission("admin_teams:manage");
  const supabase = await createRbacDbClient();

  const { error } = await supabase
    .from("crm_team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  await audit(session.userId, "team.member_removed", "crm_team", teamId, {
    user_id: userId,
  });
  revalidatePath("/admin/teams");
  return { success: true };
}

export interface TeamModuleAccess {
  module_key: string;
  module_name: string;
  can_read: boolean;
  can_write: boolean;
}

export async function listTeamModuleAccess(
  teamId: string
): Promise<TeamModuleAccess[]> {
  await requirePermission("admin_teams:manage");
  const supabase = await createRbacDbClient();

  const { data: modules, error: modError } = await supabase
    .from("crm_modules")
    .select("key, name")
    .eq("is_active", true)
    .not("key", "like", "admin_%")
    .order("sort_order");

  if (modError) throw new Error(modError.message);

  const { data: access, error: accError } = await supabase
    .from("crm_team_module_access")
    .select("module_key, can_read, can_write")
    .eq("team_id", teamId);

  if (accError) throw new Error(accError.message);

  const accessMap = Object.fromEntries(
    (access ?? []).map((a) => [a.module_key, a])
  );

  return (modules ?? []).map((m) => ({
    module_key: m.key,
    module_name: m.name,
    can_read: accessMap[m.key]?.can_read ?? false,
    can_write: accessMap[m.key]?.can_write ?? false,
  }));
}

export async function setTeamModuleAccess(
  teamId: string,
  moduleKey: string,
  canRead: boolean,
  canWrite: boolean
) {
  const session = await requirePermission("admin_teams:manage");
  const supabase = await createRbacDbClient();

  if (!canRead && !canWrite) {
    const { error } = await supabase
      .from("crm_team_module_access")
      .delete()
      .eq("team_id", teamId)
      .eq("module_key", moduleKey);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("crm_team_module_access").upsert({
      team_id: teamId,
      module_key: moduleKey,
      can_read: canRead,
      can_write: canWrite,
    });
    if (error) throw new Error(error.message);
  }

  await audit(session.userId, "team.module_access", "crm_team", teamId, {
    module_key: moduleKey,
    can_read: canRead,
    can_write: canWrite,
  });
  revalidatePath("/admin/teams");
  revalidatePath("/", "layout");
  return { success: true };
}

// ─── Roles & Permissions ─────────────────────────────────────────────────────

export interface CrmRoleDetail {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_system: boolean;
  permission_keys: string[];
}

export async function listCrmRolesDetailed(): Promise<CrmRoleDetail[]> {
  await requirePermission("admin_roles:manage");
  const supabase = await createRbacDbClient();

  const { data: roles, error } = await supabase
    .from("crm_roles")
    .select("id, key, name, description, is_system")
    .order("name");

  if (error) throw new Error(error.message);

  const { data: rolePerms } = await supabase
    .from("crm_role_permissions")
    .select("role_id, permission:crm_permissions ( key )");

  const permMap: Record<string, string[]> = {};
  for (const rp of rolePerms ?? []) {
    const perm = Array.isArray(rp.permission) ? rp.permission[0] : rp.permission;
    if (!perm?.key) continue;
    if (!permMap[rp.role_id]) permMap[rp.role_id] = [];
    permMap[rp.role_id].push(perm.key);
  }

  return (roles ?? []).map((r) => ({
    ...r,
    permission_keys: permMap[r.id] ?? [],
  }));
}

export async function listAllPermissions() {
  await requireRolesOrUsersAdmin();
  const supabase = await createRbacDbClient();

  const { data, error } = await supabase
    .from("crm_permissions")
    .select("id, key, module_key, action, description")
    .order("module_key")
    .order("action");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listModulesForRoles() {
  await requireRolesOrUsersAdmin();
  const supabase = await createRbacDbClient();

  const { data, error } = await supabase
    .from("crm_modules")
    .select("key, name, sort_order")
    .order("sort_order");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCrmRole(input: {
  key: string;
  name: string;
  description?: string;
}) {
  const session = await requirePermission("admin_roles:manage");
  const supabase = await createRbacDbClient();
  const key = slugify(input.key).replace(/-/g, "_");

  const { data, error } = await supabase
    .from("crm_roles")
    .insert({
      key,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      is_system: false,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await audit(session.userId, "role.created", "crm_role", data.id, { key });
  revalidatePath("/admin/roles");
  return { success: true, id: data.id };
}

export async function setRolePermissions(
  roleId: string,
  permissionKeys: string[]
) {
  const session = await requirePermission("admin_roles:manage");
  const supabase = await createRbacDbClient();

  const { data: role } = await supabase
    .from("crm_roles")
    .select("key, is_system")
    .eq("id", roleId)
    .single();

  if (!role) throw new Error("Role not found");
  if (role.key === "super_admin") {
    throw new Error("Cannot modify super admin permissions");
  }

  const { data: perms } = await supabase
    .from("crm_permissions")
    .select("id, key")
    .in("key", permissionKeys);

  const { error: delError } = await supabase
    .from("crm_role_permissions")
    .delete()
    .eq("role_id", roleId);

  if (delError) throw new Error(delError.message);

  if (perms?.length) {
    const { error: insError } = await supabase.from("crm_role_permissions").insert(
      perms.map((p) => ({ role_id: roleId, permission_id: p.id }))
    );
    if (insError) throw new Error(insError.message);
  }

  await audit(session.userId, "role.permissions_updated", "crm_role", roleId, {
    permissions: permissionKeys,
  });
  revalidatePath("/admin/roles");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteCrmRole(roleId: string) {
  const session = await requirePermission("admin_roles:manage");
  const supabase = await createRbacDbClient();

  const { data: role } = await supabase
    .from("crm_roles")
    .select("key, is_system")
    .eq("id", roleId)
    .single();

  if (!role) throw new Error("Role not found");
  if (role.is_system) throw new Error("Cannot delete system roles");

  const { count } = await supabase
    .from("crm_profiles")
    .select("*", { count: "exact", head: true })
    .eq("role_id", roleId);

  if (count && count > 0) {
    throw new Error("Cannot delete role assigned to users");
  }

  const { error } = await supabase.from("crm_roles").delete().eq("id", roleId);
  if (error) throw new Error(error.message);

  await audit(session.userId, "role.deleted", "crm_role", roleId);
  revalidatePath("/admin/roles");
  return { success: true };
}

// ─── Modules ─────────────────────────────────────────────────────────────────

export interface CrmModuleRow {
  id: string;
  key: string;
  name: string;
  route: string | null;
  sort_order: number;
  is_active: boolean;
}

export async function listCrmModules(): Promise<CrmModuleRow[]> {
  await requirePermission("admin_modules:manage");
  const supabase = await createRbacDbClient();

  const { data, error } = await supabase
    .from("crm_modules")
    .select("id, key, name, route, sort_order, is_active")
    .order("sort_order");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateCrmModule(
  moduleId: string,
  updates: { name?: string; sort_order?: number; is_active?: boolean }
) {
  const session = await requirePermission("admin_modules:manage");
  const supabase = await createRbacDbClient();

  const { error } = await supabase
    .from("crm_modules")
    .update(updates)
    .eq("id", moduleId);

  if (error) throw new Error(error.message);

  await audit(session.userId, "module.updated", "crm_module", moduleId, updates);
  revalidatePath("/admin/modules");
  revalidatePath("/", "layout");
  return { success: true };
}

// ─── Audit log ───────────────────────────────────────────────────────────────

export interface AuditLogRow {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor_email: string | null;
  actor_name: string | null;
}

export async function listAuditLogs(limit = 100): Promise<AuditLogRow[]> {
  await requirePermission("admin_audit:read");
  const supabase = await createRbacDbClient();

  const { data, error } = await supabase
    .from("crm_audit_logs")
    .select(
      "id, action, resource_type, resource_id, metadata, created_at, actor_id"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  if (!data?.length) return [];

  const actorIds = [
    ...new Set(data.map((row) => row.actor_id).filter(Boolean)),
  ] as string[];

  let profileMap: Record<string, { email: string; full_name: string | null }> =
    {};

  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("crm_profiles")
      .select("id, email, full_name")
      .in("id", actorIds);

    profileMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p])
    );
  }

  return data.map((row) => {
    const actor = row.actor_id ? profileMap[row.actor_id] : undefined;
    return {
      id: row.id,
      action: row.action,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      metadata: row.metadata as Record<string, unknown> | null,
      created_at: row.created_at,
      actor_email: actor?.email ?? null,
      actor_name: actor?.full_name ?? null,
    };
  });
}

export async function listCrmUsersForTeams() {
  await requirePermission("admin_teams:manage");
  const supabase = await createRbacDbClient();

  const { data, error } = await supabase
    .from("crm_profiles")
    .select("id, email, full_name, is_active")
    .eq("is_active", true)
    .order("full_name");

  if (error) throw new Error(error.message);
  return data ?? [];
}
