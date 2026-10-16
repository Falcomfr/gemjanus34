"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/require-profile";
import { createServerClient } from "@/lib/supabase/server";

export type MessageActionState = { success?: string; formError?: string };

const messageIdSchema = z.uuid();

function revalidateMessagePaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/messages");
}

export async function markMessageHandled(
  _previousState: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const profile = await requireProfile();
  const id = messageIdSchema.safeParse(formData.get("messageId"));
  if (!id.success) return { formError: "Le message demandé est invalide." };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("contact_messages")
    .update({ handled_at: new Date().toISOString(), handled_by: profile.id })
    .eq("id", id.data);
  if (error) return { formError: "Le message n’a pas pu être mis à jour." };

  revalidateMessagePaths();
  return { success: "Message marqué comme traité." };
}

export async function deleteMessage(
  _previousState: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  await requireProfile();
  const id = messageIdSchema.safeParse(formData.get("messageId"));
  if (!id.success) return { formError: "Le message demandé est invalide." };

  const supabase = await createServerClient();
  const { error } = await supabase.from("contact_messages").delete().eq("id", id.data);
  if (error) return { formError: "Le message n’a pas pu être supprimé." };

  revalidateMessagePaths();
  return { success: "Message supprimé." };
}
