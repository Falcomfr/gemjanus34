"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile, type Profile } from "@/lib/auth/require-profile";
import type { Json } from "@/lib/database.types";
import {
  buildPageUpdate,
  parsePageFormData,
  type PageField,
} from "@/lib/admin/page-input";
import { createServerClient } from "@/lib/supabase/server";

export type PageActionState = {
  success?: string;
  formError?: string;
  fieldErrors?: Partial<Record<PageField, string[]>>;
};

export const initialPageActionState: PageActionState = {};

const pageIdSchema = z.object({ pageId: z.uuid() });
const revisionIdSchema = z.object({ revisionId: z.uuid() });

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function requireAdmin(profile: Profile): PageActionState | null {
  return profile.role === "admin"
    ? null
    : { formError: "Cette action est réservée aux administrateurs." };
}

function revalidatePagePaths(slug: string, previousSlug?: string) {
  revalidatePath("/");
  revalidatePath(`/${slug}`);
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/${previousSlug}`);
  }
  revalidatePath("/admin/pages");
}

export async function createPage(
  _previousState: PageActionState,
  formData: FormData,
): Promise<PageActionState> {
  const profile = await requireProfile();
  const parsed = parsePageFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.fieldErrors };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pages")
    .insert({
      slug: parsed.data.slug,
      title: parsed.data.title,
      summary: parsed.data.summary,
      content: parsed.data.content as NonNullable<Json>,
      status: "draft",
      navigation_position:
        profile.role === "admin" ? parsed.data.navigationPosition : null,
      parent_id: profile.role === "admin" ? parsed.data.parentId : null,
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { formError: "La page n’a pas pu être créée. Vérifiez que le slug est unique." };
  }

  revalidatePagePaths(parsed.data.slug);
  redirect(`/admin/pages/${data.id}`);
}

export async function updatePage(
  _previousState: PageActionState,
  formData: FormData,
): Promise<PageActionState> {
  const profile = await requireProfile();
  const identity = pageIdSchema.safeParse({ pageId: stringValue(formData, "pageId") });
  const parsed = parsePageFormData(formData);

  if (!identity.success) {
    return { formError: "La page demandée est invalide." };
  }
  if (!parsed.success) {
    return { fieldErrors: parsed.fieldErrors };
  }

  const supabase = await createServerClient();
  const { data: existing, error: readError } = await supabase
    .from("pages")
    .select("slug, status, navigation_position, parent_id")
    .eq("id", identity.data.pageId)
    .single();

  if (readError || !existing) {
    return { formError: "La page demandée est introuvable." };
  }
  if (existing.status === "published") {
    return {
      formError: "Archivez la page publiée avant de modifier son contenu.",
    };
  }
  if (profile.role !== "admin" && existing.status !== "draft") {
    return { formError: "Seul un administrateur peut modifier cette page." };
  }

  const update = buildPageUpdate(profile.role, parsed.data, existing);
  const { error } = await supabase
    .from("pages")
    .update({
      ...update,
      content: update.content as NonNullable<Json>,
      updated_by: profile.id,
    })
    .eq("id", identity.data.pageId);

  if (error) {
    return { formError: "Les modifications n’ont pas pu être enregistrées." };
  }

  revalidatePagePaths(update.slug, existing.slug);
  return { success: "Page enregistrée." };
}

export async function publishPage(
  _previousState: PageActionState,
  formData: FormData,
): Promise<PageActionState> {
  const profile = await requireProfile();
  const identity = pageIdSchema.safeParse({ pageId: stringValue(formData, "pageId") });
  if (!identity.success) {
    return { formError: "La page demandée est invalide." };
  }
  const denied = requireAdmin(profile);
  if (denied) return denied;

  const supabase = await createServerClient();
  const { data: page, error: readError } = await supabase
    .from("pages")
    .select("slug")
    .eq("id", identity.data.pageId)
    .single();
  if (readError || !page) {
    return { formError: "La page demandée est introuvable." };
  }

  const { error } = await supabase.rpc("publish_page", { page_id: identity.data.pageId });
  if (error) {
    return { formError: "La page n’a pas pu être publiée." };
  }

  revalidatePagePaths(page.slug);
  return { success: "Page publiée et révision créée." };
}

export async function archivePage(
  _previousState: PageActionState,
  formData: FormData,
): Promise<PageActionState> {
  const profile = await requireProfile();
  const identity = pageIdSchema.safeParse({ pageId: stringValue(formData, "pageId") });
  if (!identity.success) {
    return { formError: "La page demandée est invalide." };
  }
  const denied = requireAdmin(profile);
  if (denied) return denied;

  const supabase = await createServerClient();
  const { data: page, error: readError } = await supabase
    .from("pages")
    .select("slug")
    .eq("id", identity.data.pageId)
    .single();
  if (readError || !page) {
    return { formError: "La page demandée est introuvable." };
  }

  const { error } = await supabase
    .from("pages")
    .update({ status: "archived", updated_by: profile.id })
    .eq("id", identity.data.pageId);
  if (error) {
    return { formError: "La page n’a pas pu être archivée." };
  }

  revalidatePagePaths(page.slug);
  return { success: "Page archivée. Son contenu peut maintenant être modifié." };
}

export async function restorePageRevision(
  _previousState: PageActionState,
  formData: FormData,
): Promise<PageActionState> {
  const profile = await requireProfile();
  const identity = revisionIdSchema.safeParse({
    revisionId: stringValue(formData, "revisionId"),
  });
  if (!identity.success) {
    return { formError: "La révision demandée est invalide." };
  }
  const denied = requireAdmin(profile);
  if (denied) return denied;

  const supabase = await createServerClient();
  const { data: revision, error: revisionError } = await supabase
    .from("page_revisions")
    .select("page_id")
    .eq("id", identity.data.revisionId)
    .single();
  if (revisionError || !revision) {
    return { formError: "La révision demandée est introuvable." };
  }

  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("slug")
    .eq("id", revision.page_id)
    .single();
  if (pageError || !page) {
    return { formError: "La page liée à cette révision est introuvable." };
  }

  const { error } = await supabase.rpc("restore_page_revision", {
    revision_id: identity.data.revisionId,
  });
  if (error) {
    return { formError: "La révision n’a pas pu être restaurée." };
  }

  revalidatePagePaths(page.slug);
  return { success: "Révision restaurée." };
}
