import { Temporal } from "@js-temporal/polyfill";
import { z } from "zod";
import { richContentSchema } from "@/lib/content/rich-content-schema";

const explicitOffsetTimestamp = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/)
  .refine((value) => {
    try {
      Temporal.Instant.from(value);
      return true;
    } catch {
      return false;
    }
  });

export const newsInputSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    excerpt: z.string().trim().min(1).max(500),
    content: richContentSchema,
    startsAt: explicitOffsetTimestamp,
    endsAt: explicitOffsetTimestamp.nullable(),
    featured: z.boolean(),
  })
  .refine(
    ({ startsAt, endsAt }) => {
      if (endsAt === null) return true;
      try {
        return Temporal.Instant.compare(endsAt, startsAt) >= 0;
      } catch {
        return true;
      }
    },
    { path: ["endsAt"], message: "La fin doit suivre le début." },
  );

export type NewsInput = z.infer<typeof newsInputSchema>;
export type NewsField = keyof NewsInput;
export type NewsFormResult =
  | { success: true; data: NewsInput }
  | { success: false; fieldErrors: Partial<Record<NewsField, string[]>> };

const localDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function toParisInstant(value: string): string {
  const match = localDateTimePattern.exec(value);
  if (!match) throw new RangeError("Invalid datetime-local value");

  const [, year, month, day, hour, minute] = match;
  const zoned = Temporal.ZonedDateTime.from(
    {
      timeZone: "Europe/Paris",
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: Number(hour),
      minute: Number(minute),
    },
    { disambiguation: "reject", overflow: "reject" },
  );

  return zoned.toInstant().toString();
}

const fieldMessages: Record<NewsField, string> = {
  title: "Le titre doit contenir entre 1 et 160 caractères.",
  excerpt: "Le résumé doit contenir entre 1 et 500 caractères.",
  content: "Le contenu contient un élément non autorisé.",
  startsAt: "La date de début est invalide ou ambiguë.",
  endsAt: "La date de fin est invalide ou précède le début.",
  featured: "La mise en avant est invalide.",
};

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function parseContent(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export function parseNewsFormData(formData: FormData): NewsFormResult {
  const localStartsAt = stringValue(formData, "startsAt");
  const localEndsAt = stringValue(formData, "endsAt");
  let startsAt: string;
  let endsAt: string | null;

  try {
    startsAt = toParisInstant(localStartsAt);
  } catch {
    return { success: false, fieldErrors: { startsAt: [fieldMessages.startsAt] } };
  }

  try {
    endsAt = localEndsAt === "" ? null : toParisInstant(localEndsAt);
  } catch {
    return { success: false, fieldErrors: { endsAt: [fieldMessages.endsAt] } };
  }

  const result = newsInputSchema.safeParse({
    title: stringValue(formData, "title"),
    excerpt: stringValue(formData, "excerpt"),
    content: parseContent(stringValue(formData, "content")),
    startsAt,
    endsAt,
    featured: formData.get("featured") === "on",
  });

  if (result.success) return result;

  const flattened = z.flattenError(result.error).fieldErrors;
  const fieldErrors: Partial<Record<NewsField, string[]>> = {};
  for (const field of Object.keys(flattened) as NewsField[]) {
    fieldErrors[field] = [fieldMessages[field]];
  }
  return { success: false, fieldErrors };
}
