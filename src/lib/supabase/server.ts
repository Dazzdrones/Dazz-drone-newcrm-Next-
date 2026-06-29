import { createClient, SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null = null;

export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Copy .env.local.example to .env.local and add your credentials."
    );
  }

  if (!serverClient) {
    serverClient = createClient(supabaseUrl, supabaseKey);
  }

  return serverClient;
}
