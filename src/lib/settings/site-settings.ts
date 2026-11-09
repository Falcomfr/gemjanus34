import { cache } from "react";
import { createServerClient } from "@/lib/supabase/server";

export type SiteSettings = {
  callbackEnabled: boolean;
  membershipEnabled: boolean;
  helloassoUrl: string | null;
};

export const defaultSiteSettings: SiteSettings = { callbackEnabled: true, membershipEnabled: false, helloassoUrl: null };

// Never breaks a public page: unreadable settings mean the defaults.
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("callback_enabled, membership_enabled, helloasso_url")
      .single();
    if (error || !data) return defaultSiteSettings;
    return {
      callbackEnabled: data.callback_enabled,
      membershipEnabled: data.membership_enabled,
      helloassoUrl: data.helloasso_url,
    };
  } catch {
    return defaultSiteSettings;
  }
});

export function membershipHref(settings: SiteSettings): string | null {
  return settings.membershipEnabled && settings.helloassoUrl ? settings.helloassoUrl : null;
}
