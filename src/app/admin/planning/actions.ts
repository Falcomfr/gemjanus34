"use server";

import { z } from "zod";
import { parsePlanningDay, parsePlanningException, parsePlanningSettings, parsePlanningSlot } from "@/lib/admin/planning-input";
import { requireProfile } from "@/lib/auth/require-profile";
import { refreshPublicContent } from "@/lib/content/public-cache";
import type { Database } from "@/lib/database.types";
import type { PlanningSlot } from "@/content/types";
import { isoWeekday, occursOn, parisDate, recurrenceLabel } from "@/lib/planning/week";
import { createServerClient } from "@/lib/supabase/server";

export type PlanningActionState = {
  success?: string;
  formError?: string;
  fieldErrors?: Record<string, string[]>;
};

const revalidatePlanningPaths = refreshPublicContent;

export async function savePlanningSlot(_previous: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  await requireProfile();
  const parsed = parsePlanningSlot(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  const { id, day, startsAt, endsAt, title, leader, note, description, family, recurrence, monthWeeks } = parsed.data;
  const values = { day, starts_at: startsAt, ends_at: endsAt, title, leader, note, description, family, recurrence, month_weeks: monthWeeks };
  const supabase = await createServerClient();
  const { error } = id
    ? await supabase.from("planning_slots").update(values).eq("id", id)
    : await supabase.from("planning_slots").insert(values);
  if (error) return { formError: "Le créneau n’a pas pu être enregistré." };

  revalidatePlanningPaths();
  return { success: id ? "Créneau enregistré." : "Créneau ajouté." };
}

export async function deletePlanningSlot(_previous: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  await requireProfile();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { formError: "Le créneau demandé est invalide." };

  const supabase = await createServerClient();
  const { error } = await supabase.from("planning_slots").delete().eq("id", id.data);
  if (error) return { formError: "Le créneau n’a pas pu être supprimé." };

  revalidatePlanningPaths();
  return { success: "Créneau supprimé." };
}

export async function savePlanningDay(_previous: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  await requireProfile();
  const parsed = parsePlanningDay(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  const { day, opensAt, closesAt, team } = parsed.data;
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("planning_days")
    .update({ opens_at: opensAt, closes_at: closesAt, team })
    .eq("day", day);
  if (error) return { formError: "Le jour n’a pas pu être enregistré." };

  revalidatePlanningPaths();
  return { success: "Horaires enregistrés." };
}

export async function savePlanningSettings(_previous: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  await requireProfile();
  const parsed = parsePlanningSettings(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("planning_settings")
    .update({ effective_from: parsed.data.effectiveFrom, note: parsed.data.note, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { formError: "Les informations du planning n’ont pas pu être enregistrées." };

  revalidatePlanningPaths();
  return { success: "Planning enregistré." };
}

const weekdays = ["", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

export async function addPlanningException(_previous: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  await requireProfile();
  const parsed = parsePlanningException(formData, parisDate(new Date().toISOString()));
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  const input = parsed.data;
  const supabase = await createServerClient();
  if (input.kind === "cancel") {
    const { data: slot, error } = await supabase
      .from("planning_slots")
      .select("day, recurrence, month_weeks")
      .eq("id", input.slotId)
      .maybeSingle();
    if (error || !slot) return { fieldErrors: { slotId: ["Cette séance n’existe plus."] } };
    if (isoWeekday(input.date) !== slot.day) {
      return { fieldErrors: { date: [`Cette séance a lieu le ${weekdays[slot.day]} : choisissez un ${weekdays[slot.day]}.`] } };
    }
    const recurrence = { day: slot.day, recurrence: slot.recurrence as PlanningSlot["recurrence"], monthWeeks: slot.month_weeks };
    if (!occursOn(recurrence, input.date)) {
      return { fieldErrors: { date: [`Cette séance n’a pas lieu ce jour-là (${recurrenceLabel(recurrence).toLowerCase()}).`] } };
    }
  }

  const values: Database["public"]["Tables"]["planning_exceptions"]["Insert"] =
    input.kind === "cancel"
      ? { kind: input.kind, slot_id: input.slotId, date: input.date, reason: input.reason, hidden: input.hidden }
      : input.kind === "closure"
        ? { kind: input.kind, date: input.date, end_date: input.endDate, reason: input.reason }
        : {
            kind: input.kind,
            date: input.date,
            starts_at: input.startsAt,
            ends_at: input.endsAt,
            title: input.title,
            leader: input.leader,
            description: input.description,
            family: input.family,
          };
  const { error } = await supabase.from("planning_exceptions").insert(values);
  if (error?.code === "23505") return { fieldErrors: { date: ["Cette séance est déjà annulée ce jour-là."] } };
  if (error) return { formError: "Le changement n’a pas pu être enregistré." };

  revalidatePlanningPaths();
  const done = { cancel: "Séance annulée.", closure: "Fermeture enregistrée.", extra: "Séance exceptionnelle ajoutée." };
  return { success: done[input.kind] };
}

export async function deletePlanningException(_previous: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  await requireProfile();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { formError: "Le changement demandé est invalide." };

  const supabase = await createServerClient();
  const { error } = await supabase.from("planning_exceptions").delete().eq("id", id.data);
  if (error) return { formError: "Le changement n’a pas pu être supprimé." };

  revalidatePlanningPaths();
  return { success: "Changement supprimé." };
}
