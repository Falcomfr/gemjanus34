import { z } from "zod";
import { contact } from "@/content/contact";
import { toParisInstant } from "./news-input";

const fieldsSchema = z.object({
  title: z.string().trim().min(1).max(160),
  speaker: z.string().trim().max(120).transform((value) => value || null),
  place: z.string().trim().max(160).transform((value) => value || `${contact.street}, ${contact.city}`),
  description: z.string().trim().max(2000),
  capacity: z
    .string()
    .trim()
    .regex(/^(\d{1,4})?$/)
    .transform((value) => (value ? Number(value) : null))
    .refine((value) => value === null || (value >= 1 && value <= 1000)),
});

export type ConferenceField = keyof z.infer<typeof fieldsSchema> | "startsAt";
export type ConferenceInput = z.infer<typeof fieldsSchema> & { startsAt: string };

const fieldMessages: Record<ConferenceField, string> = {
  title: "Indiquez un titre de 160 caractères au plus.",
  speaker: "120 caractères au plus.",
  place: "160 caractères au plus.",
  description: "2 000 caractères au plus.",
  capacity: "Indiquez un nombre de places entre 1 et 1 000, ou laissez vide s’il n’y a pas de limite.",
  startsAt: "Indiquez la date et l’heure de la conférence.",
};

export function parseConferenceForm(
  formData: FormData,
): { success: true; data: ConferenceInput } | { success: false; fieldErrors: Partial<Record<ConferenceField, string[]>> } {
  const text = (name: string) => String(formData.get(name) ?? "");
  const fields = fieldsSchema.safeParse({
    title: text("title"),
    speaker: text("speaker"),
    place: text("place"),
    description: text("description"),
    capacity: text("capacity"),
  });
  const fieldErrors: Partial<Record<ConferenceField, string[]>> = {};
  if (!fields.success) {
    for (const issue of fields.error.issues) fieldErrors[issue.path[0] as ConferenceField] = [fieldMessages[issue.path[0] as ConferenceField]];
  }

  let startsAt: string | null = null;
  try {
    startsAt = toParisInstant(text("startsAt"));
  } catch {
    fieldErrors.startsAt = [fieldMessages.startsAt];
  }

  if (!fields.success || !startsAt) return { success: false, fieldErrors };
  return { success: true, data: { ...fields.data, startsAt } };
}
