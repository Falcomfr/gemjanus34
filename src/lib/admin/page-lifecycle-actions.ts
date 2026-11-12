import { z } from "zod";
import type { Profile } from "@/lib/auth/require-profile";
import { canManageContent } from "@/lib/auth/roles";
import type { PageField } from "./page-input";
import { FIXED_PAGE_SLUGS } from "./page-input";

export type PageActionState = {
  success?: string;
  formError?: string;
  fieldErrors?: Partial<Record<PageField, string[]>>;
};

type QueryResult<T> = Promise<{ data: T | null; error: unknown }>;
type MutationResult = Promise<{ error: unknown }>;

type LifecyclePageDependencies = {
  requireProfile: () => Promise<Profile>;
  loadPageSlug: (pageId: string) => QueryResult<{ slug: string; status: "draft" | "published" | "archived" }>;
  loadRevisionPageId: (revisionId: string) => QueryResult<{ page_id: string }>;
  publish: (pageId: string) => MutationResult;
  archive: (pageId: string, profileId: string) => MutationResult;
  restore: (revisionId: string) => MutationResult;
  /** `count` is 0 when the database kept the page (row security). */
  remove: (pageId: string) => Promise<{ error: unknown; count: number | null }>;
  revalidatePath: (path: string, type?: "layout" | "page") => void;
};

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

function requireContentManager(profile: Profile): PageActionState | null {
  return canManageContent(profile.role)
    ? null
    : { formError: "Cette action est réservée aux administrateurs et aux gestionnaires." };
}

// Pages appear in every footer's site map, so refresh the whole site.
function revalidatePagePaths(revalidatePath: LifecyclePageDependencies["revalidatePath"]) {
  revalidatePath("/", "layout");
}

export function createLifecyclePageActions(dependencies: LifecyclePageDependencies) {
  return {
    async publishPage(
      _previousState: PageActionState,
      formData: FormData,
    ): Promise<PageActionState> {
      const profile = await dependencies.requireProfile();
      const identity = pageIdSchema.safeParse({ pageId: stringValue(formData, "pageId") });
      if (!identity.success) {
        return { formError: "La page demandée est invalide." };
      }
      const denied = requireContentManager(profile);
      if (denied) return denied;

      const { data: page, error: readError } = await dependencies.loadPageSlug(
        identity.data.pageId,
      );
      if (readError || !page) {
        return { formError: "La page demandée est introuvable." };
      }

      const { error } = await dependencies.publish(identity.data.pageId);
      if (error) {
        return { formError: "La page n’a pas pu être publiée." };
      }

      revalidatePagePaths(dependencies.revalidatePath);
      return { success: "Page publiée et révision créée." };
    },

    async archivePage(
      _previousState: PageActionState,
      formData: FormData,
    ): Promise<PageActionState> {
      const profile = await dependencies.requireProfile();
      const identity = pageIdSchema.safeParse({ pageId: stringValue(formData, "pageId") });
      if (!identity.success) {
        return { formError: "La page demandée est invalide." };
      }
      const denied = requireAdmin(profile);
      if (denied) return denied;

      const { data: page, error: readError } = await dependencies.loadPageSlug(
        identity.data.pageId,
      );
      if (readError || !page) {
        return { formError: "La page demandée est introuvable." };
      }

      if ((FIXED_PAGE_SLUGS as readonly string[]).includes(page.slug)) {
        return { formError: "Les pages du site ne peuvent pas être archivées : modifiez leur contenu." };
      }

      const { error } = await dependencies.archive(identity.data.pageId, profile.id);
      if (error) {
        return { formError: "La page n’a pas pu être archivée." };
      }

      revalidatePagePaths(dependencies.revalidatePath);
      return { success: "Page archivée. Son contenu peut maintenant être modifié." };
    },

    async deletePage(
      _previousState: PageActionState,
      formData: FormData,
    ): Promise<PageActionState> {
      const profile = await dependencies.requireProfile();
      const identity = pageIdSchema.safeParse({ pageId: stringValue(formData, "pageId") });
      if (!identity.success) {
        return { formError: "La page demandée est invalide." };
      }
      const denied = requireAdmin(profile);
      if (denied) return denied;

      const { data: page, error: readError } = await dependencies.loadPageSlug(
        identity.data.pageId,
      );
      if (readError || !page) {
        return { formError: "La page demandée est introuvable." };
      }
      if (page.status !== "archived") {
        return { formError: "Archivez d’abord la page avant de la supprimer." };
      }

      const { error, count } = await dependencies.remove(identity.data.pageId);
      if (error || count === 0) {
        return { formError: "La page n’a pas pu être supprimée. Si d’autres pages l’ont pour page parente, changez d’abord leur page parente." };
      }

      revalidatePagePaths(dependencies.revalidatePath);
      return { success: "Page supprimée définitivement." };
    },

    async restorePageRevision(
      _previousState: PageActionState,
      formData: FormData,
    ): Promise<PageActionState> {
      const profile = await dependencies.requireProfile();
      const identity = revisionIdSchema.safeParse({
        revisionId: stringValue(formData, "revisionId"),
      });
      if (!identity.success) {
        return { formError: "La révision demandée est invalide." };
      }
      const denied = requireContentManager(profile);
      if (denied) return denied;

      const { data: revision, error: revisionError } =
        await dependencies.loadRevisionPageId(identity.data.revisionId);
      if (revisionError || !revision) {
        return { formError: "La révision demandée est introuvable." };
      }

      const { data: page, error: pageError } = await dependencies.loadPageSlug(
        revision.page_id,
      );
      if (pageError || !page) {
        return { formError: "La page liée à cette révision est introuvable." };
      }

      const { error } = await dependencies.restore(identity.data.revisionId);
      if (error) {
        return { formError: "La révision n’a pas pu être restaurée." };
      }

      revalidatePagePaths(dependencies.revalidatePath);
      return { success: "Révision restaurée." };
    },
  };
}
