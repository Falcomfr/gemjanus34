"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parseNewsFormData, type NewsField } from "@/lib/admin/news-input";
import { requireProfile } from "@/lib/auth/require-profile";
import type { Json } from "@/lib/database.types";
import { createServerClient } from "@/lib/supabase/server";

export type NewsActionState = {
  success?: string;
  formError?: string;
  fieldErrors?: Partial<Record<NewsField, string[]>>;
};

const newsIdSchema = z.uuid();

function newsId(formData: FormData): string | null {
  const parsed = newsIdSchema.safeParse(formData.get("newsId"));
  return parsed.success ? parsed.data : null;
}

function revalidateNewsPaths() {
  revalidatePath("/");
  revalidatePath("/actualites");
  revalidatePath("/admin/actualites");
}

export async function createNews(
  _previousState: NewsActionState,
  formData: FormData,
): Promise<NewsActionState> {
  const profile = await requireProfile();
  const parsed = parseNewsFormData(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("news")
    .insert({
      title: parsed.data.title,
      excerpt: parsed.data.excerpt,
      content: parsed.data.content as NonNullable<Json>,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
      featured: parsed.data.featured,
      status: "draft",
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) return { formError: "L’actualité n’a pas pu être créée." };

  revalidateNewsPaths();
  redirect(`/admin/actualites/${data.id}`);
}

export async function updateNews(
  _previousState: NewsActionState,
  formData: FormData,
): Promise<NewsActionState> {
  const profile = await requireProfile();
  const id = newsId(formData);
  const parsed = parseNewsFormData(formData);
  if (!id) return { formError: "L’actualité demandée est invalide." };
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  const supabase = await createServerClient();
  const { data: existing, error: readError } = await supabase
    .from("news")
    .select("status")
    .eq("id", id)
    .single();

  if (readError || !existing) return { formError: "L’actualité demandée est introuvable." };
  if (existing.status !== "draft") {
    return { formError: "Seuls les brouillons peuvent être modifiés." };
  }

  const { error } = await supabase
    .from("news")
    .update({
      title: parsed.data.title,
      excerpt: parsed.data.excerpt,
      content: parsed.data.content as NonNullable<Json>,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
      featured: parsed.data.featured,
      updated_by: profile.id,
    })
    .eq("id", id);

  if (error) return { formError: "Les modifications n’ont pas pu être enregistrées." };
  revalidateNewsPaths();
  return { success: "Actualité enregistrée." };
}

export async function publishNews(
  _previousState: NewsActionState,
  formData: FormData,
): Promise<NewsActionState> {
  await requireProfile();
  const id = newsId(formData);
  if (!id) return { formError: "L’actualité demandée est invalide." };

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("publish_news", { news_id: id });
  if (error) return { formError: "L’actualité n’a pas pu être publiée." };

  revalidateNewsPaths();
  return { success: "Actualité publiée." };
}

export async function archiveNews(
  _previousState: NewsActionState,
  formData: FormData,
): Promise<NewsActionState> {
  const profile = await requireProfile();
  if (profile.role !== "admin") {
    return { formError: "Seul un administrateur peut archiver une actualité." };
  }
  const id = newsId(formData);
  if (!id) return { formError: "L’actualité demandée est invalide." };

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("archive_news", { news_id: id });
  if (error) return { formError: "L’actualité n’a pas pu être archivée." };

  revalidateNewsPaths();
  return { success: "Actualité archivée." };
}

export async function restoreNews(
  _previousState: NewsActionState,
  formData: FormData,
): Promise<NewsActionState> {
  const profile = await requireProfile();
  if (profile.role !== "admin") {
    return { formError: "Seul un administrateur peut restaurer une actualité." };
  }
  const id = newsId(formData);
  if (!id) return { formError: "L’actualité demandée est invalide." };

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("restore_news", { news_id: id });
  if (error) return { formError: "L’actualité n’a pas pu être restaurée." };

  revalidateNewsPaths();
  return { success: "Actualité restaurée et republiée." };
}
