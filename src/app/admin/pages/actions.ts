"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/require-profile";
import type { Json } from "@/lib/database.types";
import {
  buildPageUpdate,
  parsePageFormData,
} from "@/lib/admin/page-input";
import {
  createLifecyclePageActions,
  type PageActionState,
} from "@/lib/admin/page-lifecycle-actions";
import { createServerClient } from "@/lib/supabase/server";

export type { PageActionState } from "@/lib/admin/page-lifecycle-actions";

const pageIdSchema = z.object({ pageId: z.uuid() });

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function revalidatePagePaths(slug: string, previousSlug?: string) {
  revalidatePath("/");
  revalidatePath(`/${slug}`);
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/${previousSlug}`);
  }
  revalidatePath("/admin/pages");
}

function createLifecycleDependencies() {
  let clientPromise: ReturnType<typeof createServerClient> | undefined;
  const getClient = () => {
    clientPromise ??= createServerClient();
    return clientPromise;
  };

  return {
    requireProfile,
    revalidatePath,
    loadPageSlug: async (pageId: string) => {
      const supabase = await getClient();
      return supabase.from("pages").select("slug").eq("id", pageId).single();
    },
    loadRevisionPageId: async (revisionId: string) => {
      const supabase = await getClient();
      return supabase
        .from("page_revisions")
        .select("page_id")
        .eq("id", revisionId)
        .single();
    },
    publish: async (pageId: string) => {
      const supabase = await getClient();
      return supabase.rpc("publish_page", { page_id: pageId });
    },
    archive: async (pageId: string, profileId: string) => {
      const supabase = await getClient();
      return supabase
        .from("pages")
        .update({ status: "archived", updated_by: profileId })
        .eq("id", pageId);
    },
    restore: async (revisionId: string) => {
      const supabase = await getClient();
      return supabase.rpc("restore_page_revision", { revision_id: revisionId });
    },
  };
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
  previousState: PageActionState,
  formData: FormData,
): Promise<PageActionState> {
  return createLifecyclePageActions(createLifecycleDependencies()).publishPage(
    previousState,
    formData,
  );
}

export async function archivePage(
  previousState: PageActionState,
  formData: FormData,
): Promise<PageActionState> {
  return createLifecyclePageActions(createLifecycleDependencies()).archivePage(
    previousState,
    formData,
  );
}

export async function restorePageRevision(
  previousState: PageActionState,
  formData: FormData,
): Promise<PageActionState> {
  return createLifecyclePageActions(createLifecycleDependencies()).restorePageRevision(
    previousState,
    formData,
  );
}
