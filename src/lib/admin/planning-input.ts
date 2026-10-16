import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const optionalTime = z.union([time, z.literal("")]).transform((value) => value || null);

const slotSchema = z
  .object({
    id: z.union([z.uuid(), z.literal("")]).transform((value) => value || null),
    day: z.coerce.number().int().min(1).max(6),
    startsAt: time,
    endsAt: time,
    title: z.string().trim().min(1).max(120),
    leader: z.string().trim().max(120),
    note: z.string().trim().max(300),
    description: z.string().trim().max(600),
    family: z.enum(["creer", "bouger", "echanger"]),
  })
  .refine(({ startsAt, endsAt }) => endsAt > startsAt, { path: ["endsAt"] });

const daySchema = z
  .object({
    day: z.coerce.number().int().min(1).max(6),
    opensAt: optionalTime,
    closesAt: optionalTime,
    team: z.string().trim().max(120),
  })
  .refine(({ opensAt, closesAt }) => !opensAt || !closesAt || closesAt > opensAt, { path: ["closesAt"] });

const settingsSchema = z.object({
  effectiveFrom: z.iso.date(),
  note: z.string().trim().max(300),
});

const messages: Record<string, string> = {
  day: "Choisissez un jour.",
  startsAt: "Indiquez l’heure de début (hh:mm).",
  endsAt: "La fin doit suivre le début.",
  title: "Indiquez le nom de l’activité (120 caractères au plus).",
  leader: "120 caractères au plus.",
  note: "300 caractères au plus.",
  description: "600 caractères au plus.",
  family: "Choisissez une famille d’activité.",
  opensAt: "Indiquez l’heure d’ouverture (hh:mm) ou laissez vide si fermé.",
  closesAt: "La fermeture doit suivre l’ouverture.",
  team: "120 caractères au plus.",
  effectiveFrom: "Indiquez la date d’entrée en vigueur.",
};

type Result<T> = { success: true; data: T } | { success: false; fieldErrors: Record<string, string[]> };

const isTime = (value: unknown): value is string => typeof value === "string" && time.safeParse(value).success;

// `order` names a start and an end field; it is checked even when other fields fail,
// because Zod skips object refinements until every field is valid.
function parse<T>(schema: z.ZodType<T>, formData: FormData, fields: string[], order?: [string, string]): Result<T> {
  const values = Object.fromEntries(fields.map((field) => [field, formData.get(field) ?? ""]));
  const result = schema.safeParse(values);
  if (result.success) return { success: true, data: result.data };
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0]);
    fieldErrors[field] = [messages[field] ?? "Valeur invalide."];
  }
  if (order) {
    const [start, end] = order;
    if (isTime(values[start]) && isTime(values[end]) && values[end] <= values[start]) {
      fieldErrors[end] = [messages[end]!];
    }
  }
  return { success: false, fieldErrors };
}

export const parsePlanningSlot = (formData: FormData) =>
  parse(slotSchema, formData, ["id", "day", "startsAt", "endsAt", "title", "leader", "note", "description", "family"], ["startsAt", "endsAt"]);
export const parsePlanningDay = (formData: FormData) =>
  parse(daySchema, formData, ["day", "opensAt", "closesAt", "team"], ["opensAt", "closesAt"]);
export const parsePlanningSettings = (formData: FormData) => parse(settingsSchema, formData, ["effectiveFrom", "note"]);
