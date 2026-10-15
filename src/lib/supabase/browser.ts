"use client";

import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { getSupabaseConfig } from "./config";

export function createBrowserClient() {
  const { url, publishableKey } = getSupabaseConfig();

  return createSupabaseBrowserClient<Database>(url, publishableKey);
}
