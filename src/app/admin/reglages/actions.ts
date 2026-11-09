"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/require-profile";
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) return { formError: "Les réglages n’ont pas pu être enregistrés." };

  revalidatePath("/", "layout");
  return { success: "Réglages enregistrés." };
}
