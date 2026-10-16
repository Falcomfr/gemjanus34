"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parsePasswordChange } from "@/lib/admin/account-input";
import { requireProfile } from "@/lib/auth/require-profile";
import { createServerClient } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/supabase/verify-password";

export type MyAccountState = { success?: string; formError?: string; fieldErrors?: Record<string, string[]> };

export async function updateMyName(_previous: MyAccountState, formData: FormData): Promise<MyAccountState> {
  const profile = await requireProfile();
  const name = z.string().trim().min(2).max(100).safeParse(formData.get("displayName") ?? "");
  if (!name.success) return { fieldErrors: { displayName: ["Le nom doit contenir entre 2 et 100 caractères."] } };

  const supabase = await createServerClient();
  const { error } = await supabase.from("profiles").update({ display_name: name.data }).eq("id", profile.id);
  if (error) return { formError: "Le nom n’a pas pu être modifié." };

  revalidatePath("/admin", "layout");
  return { success: "Nom modifié." };
}

export async function changeMyPassword(_previous: MyAccountState, formData: FormData): Promise<MyAccountState> {
  await requireProfile();
  const parsed = parsePasswordChange(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email || !(await verifyPassword(email, parsed.data.currentPassword))) {
    return { fieldErrors: { currentPassword: ["Mot de passe actuel incorrect."] } };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) return { formError: "Le mot de passe n’a pas pu être modifié." };
  return { success: "Mot de passe modifié." };
}
