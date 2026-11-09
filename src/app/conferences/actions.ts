"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { contact as gem } from "@/content/contact";
import { createServerClient } from "@/lib/supabase/server";

type RegistrationField = "name" | "contact" | "seats" | "consent";

export type RegistrationActionState = {
  success?: string;
  formError?: string;
  fieldErrors?: Partial<Record<RegistrationField, string>>;
};

const schema = z.object({
  conferenceId: z.uuid(),
  name: z.string().trim().min(2).max(100),
  contact: z.string().trim().min(5).max(254),
  seats: z.coerce.number().int().min(1).max(4),
  consent: z.literal(true),
  company: z.literal(""),
});

const fieldMessages: Record<RegistrationField, string> = {
  name: "Indiquez votre prénom ou votre nom (2 à 100 caractères).",
  contact: "Indiquez un téléphone ou une adresse e-mail pour que l’équipe puisse vous joindre.",
  seats: "De 1 à 4 places.",
  consent: "Cochez la case pour que l’équipe garde votre inscription.",
};

const success = "Merci, votre inscription est enregistrée. À bientôt !";
const refusals: Record<string, string> = {
  full: "Il n’y a plus assez de places pour cette conférence.",
  closed: `Les inscriptions en ligne sont fermées. Appelez-nous au ${gem.phone}.`,
  past: "Cette conférence a déjà eu lieu.",
  invalid: "Vérifiez votre nom, votre contact et le nombre de places.",
};

export async function registerForConference(_previous: RegistrationActionState, formData: FormData): Promise<RegistrationActionState> {
  const parsed = schema.safeParse({
    conferenceId: formData.get("conferenceId") ?? "",
    name: formData.get("name") ?? "",
    contact: formData.get("contact") ?? "",
    seats: formData.get("seats") ?? "1",
    consent: formData.get("consent") === "on",
    company: formData.get("website") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: RegistrationActionState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      // A filled trap field means a bot: answer as if it worked, store nothing.
      if (field === "company") return { success };
      if (field === "conferenceId") return { formError: refusals.invalid };
      fieldErrors[field as RegistrationField] = fieldMessages[field as RegistrationField];
    }
    return { fieldErrors };
  }

  const { conferenceId, name, contact, seats } = parsed.data;
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.rpc("register_for_conference", { conference_id: conferenceId, name, contact, seats });
    if (error) return { formError: `Votre inscription n’a pas pu être enregistrée. Appelez-nous au ${gem.phone}.` };
    if (data !== "ok") return { formError: refusals[data] ?? refusals.invalid };
  } catch {
    return { formError: `Votre inscription n’a pas pu être enregistrée. Appelez-nous au ${gem.phone}.` };
  }

  revalidatePath("/conferences");
  revalidatePath("/admin/conferences");
  return { success };
}
