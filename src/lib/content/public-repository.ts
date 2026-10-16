import type { SupabaseConfig } from "@/lib/supabase/config";
import { publicContentRepository as localRepository } from "./local-public-content-repository";
import type { PublicContentRepository } from "./public-content-repository";
import { createConfiguredPublicContentRepository } from "./supabase-public-content-repository";

type PublicEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
};

type RepositoryOptions = {
  env?: PublicEnvironment;
  createConfigured?: (config: SupabaseConfig) => PublicContentRepository;
};

export function getPublicContentRepository(
  options: RepositoryOptions = {},
): PublicContentRepository {
  const env = options.env ?? process.env;
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) return localRepository;

  return (options.createConfigured ?? createConfiguredPublicContentRepository)({
    url,
    publishableKey,
  });
}
