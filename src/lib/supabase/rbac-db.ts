import { createAdminClient } from "./admin";
import { createSessionClient } from "./session";

/**
 * DB client for RBAC admin operations.
 * Prefers service role (bypasses RLS) after app-layer permission checks.
 * Falls back to the logged-in user's session when service role is not configured.
 */
export async function createRbacDbClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createAdminClient();
  }
  return createSessionClient();
}
