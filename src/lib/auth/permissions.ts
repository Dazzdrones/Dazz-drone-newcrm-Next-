import { redirect } from "next/navigation";
import { getAuthSession } from "./session";
import { getModuleForPath } from "./nav-config";
import type { AuthSession } from "./types";

export function hasPermission(
  session: AuthSession,
  permission: string
): boolean {
  if (session.isSuperAdmin) return true;
  return session.permissions.includes(permission);
}

export function canAccessModule(
  session: AuthSession,
  moduleKey: string
): boolean {
  if (session.isSuperAdmin) return true;
  return session.permissions.some((p) => p.startsWith(`${moduleKey}:`));
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  return session;
}

export async function requirePermission(permission: string): Promise<AuthSession> {
  const session = await requireAuth();
  if (!hasPermission(session, permission)) redirect("/forbidden");
  return session;
}

/** For server actions — throws instead of redirecting */
export async function assertPermission(permission: string): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) throw new Error("Not authenticated");
  if (!hasPermission(session, permission)) {
    throw new Error("You do not have permission to perform this action");
  }
  return session;
}

export async function requireModule(moduleKey: string): Promise<AuthSession> {
  const session = await requireAuth();
  if (!canAccessModule(session, moduleKey)) redirect("/forbidden");
  return session;
}

export async function requirePathAccess(pathname: string): Promise<AuthSession> {
  const session = await requireAuth();
  const moduleKey = getModuleForPath(pathname);
  if (moduleKey && !canAccessModule(session, moduleKey)) {
    redirect("/forbidden");
  }
  return session;
}
