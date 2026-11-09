"use server";

import { revalidatePath } from "next/cache";
import { contact } from "@/content/contact";
import { sendContactAlert } from "@/lib/contact/alert-email";
import { callbackSchema } from "@/lib/contact/callback-schema";
import { contactSchema, type ContactInput } from "@/lib/contact/contact-schema";
import { getSiteSettings } from "@/lib/settings/site-settings";
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
    company: formData.get("website") ?? "",
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
  await sendContactAlert({ kind: "message", name, email, subject, message });

  revalidatePath("/admin");
  revalidatePath("/admin/messages");
  return { success: successMessage };
}

type CallbackField = "name" | "phone" | "preferredTime" | "consent";

export type CallbackActionState = {
  success?: string;
  formError?: string;
  fieldErrors?: Partial<Record<CallbackField, string>>;
};

const callbackFieldMessages: Record<CallbackField, string> = {
  name: "Indiquez votre prénom ou votre nom (2 à 100 caractères).",
  phone: "Indiquez un numéro de téléphone, par exemple 06 12 34 56 78.",
  preferredTime: "100 caractères au plus.",
  consent: "Cochez la case pour que l’équipe puisse vous rappeler.",
};

const callbackSuccess = "Merci, l’équipe vous rappellera.";
const callbackFailure = `Votre demande n’a pas pu être envoyée. Appelez-nous au ${contact.phone}.`;

export async function sendCallbackRequest(
  _previousState: CallbackActionState,
  formData: FormData,
): Promise<CallbackActionState> {
  const parsed = callbackSchema.safeParse({
    name: formData.get("name") ?? "",
    phone: formData.get("phone") ?? "",
    preferredTime: formData.get("preferredTime") ?? "",
    consent: formData.get("consent") === "on",
    company: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: CallbackActionState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      // A filled trap field means a bot: answer as if it worked, store nothing.
      if (field === "company") return { success: callbackSuccess };
      fieldErrors[field as CallbackField] = callbackFieldMessages[field as CallbackField];
    }
    return { fieldErrors };
  }

  if (!(await getSiteSettings()).callbackEnabled) return { formError: callbackFailure };

  const { name, phone, preferredTime } = parsed.data;
  try {
    const supabase = await createServerClient();
    const { error } = await supabase.from("contact_messages").insert({ kind: "callback", name, phone, message: preferredTime });
    if (error) return { formError: callbackFailure };
  } catch {
    return { formError: callbackFailure };
  }
  await sendContactAlert({ kind: "callback", name, phone, subject: "Demande de rappel", message: preferredTime });

  revalidatePath("/admin");
  revalidatePath("/admin/messages");
  return { success: callbackSuccess };
}
