import { cache } from "react";
import { createServerClient } from "@/lib/supabase/server";

export type SiteSettings = {
  callbackEnabled: boolean;
  membershipEnabled: boolean;
  helloassoUrl: string | null;
  galleryEnabled: boolean;
  /** Stored colours as saved; themeStyle() checks them before use. */
  theme: unknown;
  conferencesEnabled: boolean;
  registrationsEnabled: boolean;
};

export const defaultSiteSettings: SiteSettings = { callbackEnabled: true, membershipEnabled: false, helloassoUrl: null, galleryEnabled: false, theme: null, conferencesEnabled: false, registrationsEnabled: false };

/** The stored settings, or null when they cannot be read. */
export async function readSiteSettings(): Promise<SiteSettings | null> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("callback_enabled, membership_enabled, helloasso_url, gallery_enabled, theme, conferences_enabled, registrations_enabled")
      .single();
    if (error || !data) return null;
    return {
      callbackEnabled: data.callback_enabled,
      membershipEnabled: data.membership_enabled,
      helloassoUrl: data.helloasso_url,
      galleryEnabled: data.gallery_enabled,
      theme: data.theme,
      conferencesEnabled: data.conferences_enabled,
      registrationsEnabled: data.registrations_enabled,
    };
  } catch {
    return null;
  }
}

// Never breaks a public page: unreadable settings mean the defaults.
export const getSiteSettings = cache(async (): Promise<SiteSettings> => (await readSiteSettings()) ?? defaultSiteSettings);

export function membershipHref(settings: SiteSettings): string | null {
  return settings.membershipEnabled && settings.helloassoUrl ? settings.helloassoUrl : null;
}
