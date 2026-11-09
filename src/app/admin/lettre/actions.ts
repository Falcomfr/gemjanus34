"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/require-profile";
import { createServerClient } from "@/lib/supabase/server";

export type LetterActionState = { success?: string; formError?: string };

export async function saveLetterNote(_previous: LetterActionState, formData: FormData): Promise<LetterActionState> {
  const profile = await requireProfile();
  // Browsers send the line breaks of a text box as CRLF; store them as the text box counts them.
  const note = String(formData.get("note") ?? "").replace(/\r\n?/g, "\n").trim();
  if (note.length > 1500) return { formError: "Le mot de l’équipe fait 1 500 caractères au plus." };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("weekly_letter")
    .update({ note, updated_by: profile.id, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) return { formError: "Le mot de l’équipe n’a pas pu être enregistré." };

  revalidatePath("/lettre");
  return { success: "Mot de l’équipe enregistré : il apparaît dans la lettre." };
}
