"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/require-profile";
import { themeSchema, validateTheme } from "@/lib/settings/theme";
import { createServerClient } from "@/lib/supabase/server";

export type SettingsActionState = {
  success?: string;
  formError?: string;
  fieldErrors?: { helloassoUrl?: string[] };
};

const helloassoUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || value.startsWith("https://www.helloasso.com/"), {
    message: "Collez l’adresse d’une page HelloAsso, qui commence par https://www.helloasso.com/",
  });

export async function saveSiteSettings(_previous: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return { formError: "Les réglages sont réservés aux administrateurs." };

  const url = helloassoUrlSchema.safeParse(formData.get("helloassoUrl") ?? "");
  if (!url.success) return { fieldErrors: { helloassoUrl: url.error.issues.map((issue) => issue.message) } };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      callback_enabled: formData.get("callbackEnabled") === "on",
      membership_enabled: formData.get("membershipEnabled") === "on",
      helloasso_url: url.data || null,
      gallery_enabled: formData.get("galleryEnabled") === "on",
      conferences_enabled: formData.get("conferencesEnabled") === "on",
      registrations_enabled: formData.get("registrationsEnabled") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) return { formError: "Les réglages n’ont pas pu être enregistrés." };

  revalidatePath("/", "layout");
  return { success: "Réglages enregistrés." };
}

const notAdmin = { formError: "Les réglages sont réservés aux administrateurs." };

async function storeTheme(theme: Record<string, string> | null, success: string): Promise<SettingsActionState> {
  const supabase = await createServerClient();
  const { error } = await supabase.from("site_settings").update({ theme, updated_at: new Date().toISOString() }).eq("id", true);
  if (error) return { formError: "Les couleurs n’ont pas pu être enregistrées." };
  revalidatePath("/", "layout");
  return { success };
}

export async function saveTheme(_previous: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  if ((await requireProfile()).role !== "admin") return notAdmin;
  const parsed = themeSchema.safeParse(Object.fromEntries(["forest", "coral", "sun", "background", "text"].map((name) => [name, formData.get(name)])));
  if (!parsed.success) return { formError: "Choisissez les cinq couleurs." };
  const theme = Object.fromEntries(Object.entries(parsed.data).map(([name, value]) => [name, value.toLowerCase()]));
  const check = validateTheme(parsed.data);
  if (!check.ok) return { formError: check.problems.join(" ") };
  return storeTheme(theme, "Couleurs enregistrées : le site les affiche déjà.");
}

export async function resetTheme(): Promise<SettingsActionState> {
  if ((await requireProfile()).role !== "admin") return notAdmin;
  return storeTheme(null, "Le site a retrouvé ses couleurs d’origine.");
}
