import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

// Checks a password without touching the browser session: a throwaway client signs in.
export async function verifyPassword(email: string, password: string): Promise<boolean> {
  const { url, publishableKey } = getSupabaseConfig();
  const client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (!error) await client.auth.signOut({ scope: "local" });
  return !error;
}
