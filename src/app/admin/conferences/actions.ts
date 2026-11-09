"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseConferenceForm, type ConferenceField } from "@/lib/admin/conference-input";
import { requireProfile } from "@/lib/auth/require-profile";
import { createServerClient } from "@/lib/supabase/server";

export type ConferenceActionState = {
  success?: string;
  formError?: string;
  fieldErrors?: Partial<Record<ConferenceField, string[]>>;
};

const idSchema = z.uuid();

function refresh() {
  revalidatePath("/conferences");
  revalidatePath("/admin/conferences");
  revalidatePath("/lettre");
}

export async function createConference(_previous: ConferenceActionState, formData: FormData): Promise<ConferenceActionState> {
  const profile = await requireProfile();
  const parsed = parseConferenceForm(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  const { title, speaker, startsAt, place, description, capacity } = parsed.data;
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("conferences")
    .insert({ title, speaker, starts_at: startsAt, place, description, capacity, created_by: profile.id });
  if (error) return { formError: "La conférence n’a pas pu être enregistrée." };

  refresh();
  return { success: `« ${title} » est au programme.` };
}

async function remove(table: "conferences" | "conference_registrations", value: FormDataEntryValue | null, done: string): Promise<ConferenceActionState> {
  await requireProfile();
  const id = idSchema.safeParse(value);
  if (!id.success) return { formError: "L’élément demandé est invalide." };
  const supabase = await createServerClient();
  const { error } = await supabase.from(table).delete().eq("id", id.data);
  if (error) return { formError: "La suppression n’a pas abouti." };
  refresh();
  return { success: done };
}

export async function deleteConference(_previous: ConferenceActionState, formData: FormData): Promise<ConferenceActionState> {
  return remove("conferences", formData.get("conferenceId"), "Conférence supprimée, avec ses inscriptions.");
}

export async function deleteRegistration(_previous: ConferenceActionState, formData: FormData): Promise<ConferenceActionState> {
  return remove("conference_registrations", formData.get("registrationId"), "Inscription retirée.");
}
