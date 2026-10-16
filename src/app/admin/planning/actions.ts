"use server";

import { z } from "zod";
import { parsePlanningDay, parsePlanningSettings, parsePlanningSlot } from "@/lib/admin/planning-input";
import { requireProfile } from "@/lib/auth/require-profile";
import { refreshPublicContent } from "@/lib/content/public-cache";
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

  const { id, day, startsAt, endsAt, title, leader, note, family } = parsed.data;
  const values = { day, starts_at: startsAt, ends_at: endsAt, title, leader, note, family };
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
