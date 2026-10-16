import { z } from "zod";
import { isoWeekday } from "@/lib/planning/week";

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
    recurrence: z.union([z.enum(["weekly", "only", "except"]), z.literal("")]).transform((value) => value || "weekly"),
    monthWeeks: z.array(z.coerce.number().pipe(z.union([z.literal(-1), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]))),
  })
  .refine(({ startsAt, endsAt }) => endsAt > startsAt, { path: ["endsAt"] })
  .transform((slot) => ({
    ...slot,
    // Weeks only matter for a monthly slot.
    monthWeeks: slot.recurrence === "weekly" ? [] : [...new Set(slot.monthWeeks)].toSorted((left, right) => left - right),
  }))
  .refine(({ recurrence, monthWeeks }) => recurrence === "weekly" || monthWeeks.length > 0, { path: ["monthWeeks"] });

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
  recurrence: "Choisissez la récurrence.",
  monthWeeks: "Cochez au moins une semaine du mois.",
  opensAt: "Indiquez l’heure d’ouverture (hh:mm) ou laissez vide si fermé.",
  closesAt: "La fermeture doit suivre l’ouverture.",
  team: "120 caractères au plus.",
  effectiveFrom: "Indiquez la date d’entrée en vigueur.",
};

type Result<T> = { success: true; data: T } | { success: false; fieldErrors: Record<string, string[]> };

const isTime = (value: unknown): value is string => typeof value === "string" && time.safeParse(value).success;

// `order` names a start and an end field; it is checked even when other fields fail,
// because Zod skips object refinements until every field is valid.
function parse<T>(schema: z.ZodType<T>, formData: FormData, fields: string[], order?: [string, string], lists: string[] = []): Result<T> {
  const values = Object.fromEntries([
    ...fields.map((field) => [field, formData.get(field) ?? ""]),
    ...lists.map((field) => [field, formData.getAll(field)]),
  ]);
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
  parse(
    slotSchema,
    formData,
    ["id", "day", "startsAt", "endsAt", "title", "leader", "note", "description", "family", "recurrence"],
    ["startsAt", "endsAt"],
    ["monthWeeks"],
  );
export const parsePlanningDay = (formData: FormData) =>
  parse(daySchema, formData, ["day", "opensAt", "closesAt", "team"], ["opensAt", "closesAt"]);
export const parsePlanningSettings = (formData: FormData) => parse(settingsSchema, formData, ["effectiveFrom", "note"]);

export type PlanningExceptionInput =
  | { kind: "cancel"; slotId: string; date: string; reason: string; hidden: boolean }
  | { kind: "closure"; date: string; endDate: string; reason: string }
  | { kind: "extra"; date: string; startsAt: string; endsAt: string; title: string; leader: string; description: string; family: "creer" | "bouger" | "echanger" };

const reason = z.string().trim().max(200);
const exceptionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("cancel"), slotId: z.uuid(), date: z.iso.date(), reason, display: z.enum(["struck", "hidden"]) }),
  z.object({ kind: z.literal("closure"), date: z.iso.date(), endDate: z.union([z.iso.date(), z.literal("")]), reason }),
  z.object({
    kind: z.literal("extra"),
    date: z.iso.date(),
    startsAt: time,
    endsAt: time,
    title: z.string().trim().min(1).max(120),
    leader: z.string().trim().max(120),
    description: z.string().trim().max(600),
    family: z.enum(["creer", "bouger", "echanger"]),
  }),
]);

const exceptionMessages: Record<string, string> = {
  ...messages,
  kind: "Type de changement inconnu.",
  slotId: "Choisissez la séance à annuler.",
  date: "Indiquez une date.",
  endDate: "Indiquez une date de fin valide.",
  reason: "200 caractères au plus.",
  display: "Choisissez l’affichage.",
};
const future = "Choisissez une date à venir.";
const sunday = "Le GEM est fermé le dimanche : choisissez un autre jour.";

/** A dated change of the planning; `today` is the Paris calendar day. */
export function parsePlanningException(formData: FormData, today: string): Result<PlanningExceptionInput> {
  const fields = ["kind", "slotId", "date", "endDate", "reason", "display", "startsAt", "endsAt", "title", "leader", "description", "family"];
  const values = Object.fromEntries(fields.flatMap((field) => (formData.has(field) ? [[field, formData.get(field)]] : [])));
  const result = exceptionSchema.safeParse(values);
  const fieldErrors: Record<string, string[]> = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = String(issue.path[0] ?? "kind");
      fieldErrors[field] = [exceptionMessages[field] ?? "Valeur invalide."];
    }
  }
  if (values.kind === "extra" && isTime(values.startsAt) && isTime(values.endsAt) && values.endsAt <= values.startsAt) {
    fieldErrors.endsAt = [messages.endsAt!];
  }
  if (!result.success) return { success: false, fieldErrors };

  const input = result.data;
  if (input.kind === "closure") {
    const endDate = input.endDate || input.date;
    if (endDate < input.date) return { success: false, fieldErrors: { endDate: ["La fin ne peut pas précéder le début."] } };
    if (endDate < today) return { success: false, fieldErrors: { endDate: [future] } };
    return { success: true, data: { kind: "closure", date: input.date, endDate, reason: input.reason } };
  }
  if (input.date < today) return { success: false, fieldErrors: { date: [future] } };
  if (isoWeekday(input.date) === 7) return { success: false, fieldErrors: { date: [sunday] } };
  if (input.kind === "cancel") {
    return { success: true, data: { kind: "cancel", slotId: input.slotId, date: input.date, reason: input.reason, hidden: input.display === "hidden" } };
  }
  return { success: true, data: input };
}
