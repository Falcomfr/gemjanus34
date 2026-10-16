import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getSupabaseConfig } from "./config";

// Server-only: the secret key bypasses RLS. Call it only after checking that the signed-in
// profile is an administrator (see app/admin/comptes/actions.ts).
export function createAdminClient() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("La variable SUPABASE_SERVICE_ROLE_KEY est requise pour gérer les comptes.");
  return createClient<Database>(getSupabaseConfig().url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
