"use server";

import { revalidatePath } from "next/cache";
import { contact } from "@/content/contact";
import { contactSchema, type ContactInput } from "@/lib/contact/contact-schema";
import { createServerClient } from "@/lib/supabase/server";

type ContactField = Exclude<keyof ContactInput, "company">;

export type ContactActionState = {
  success?: string;
  formError?: string;
  fieldErrors?: Partial<Record<ContactField, string>>;
};

const fieldMessages: Record<ContactField, string> = {
  name: "Indiquez votre nom (2 à 100 caractères).",
  email: "Indiquez une adresse e-mail valide.",
  subject: "Indiquez un objet (3 à 150 caractères).",
  message: "Écrivez un message de 20 à 5 000 caractères.",
  consent: "Cochez la case pour que l’équipe puisse vous répondre.",
};

const successMessage = "Merci, votre message a bien été envoyé. L’équipe vous répondra par e-mail.";
const failureMessage = `Votre message n’a pas pu être envoyé. Réessayez plus tard ou appelez-nous au ${contact.phone}.`;

export async function sendContactMessage(
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    subject: formData.get("subject") ?? "",
    message: formData.get("message") ?? "",
    consent: formData.get("consent") === "on",
    company: formData.get("company") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: ContactActionState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      // A filled trap field means a bot: answer as if it worked, store nothing.
      if (field === "company") return { success: successMessage };
      fieldErrors[field as ContactField] = fieldMessages[field as ContactField];
    }
    return { fieldErrors };
  }

  const { name, email, subject, message } = parsed.data;
  try {
    const supabase = await createServerClient();
    const { error } = await supabase.from("contact_messages").insert({ name, email, subject, message });
    if (error) return { formError: failureMessage };
  } catch {
    return { formError: failureMessage };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/messages");
  return { success: successMessage };
}
