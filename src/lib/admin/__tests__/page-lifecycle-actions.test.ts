import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Profile } from "@/lib/auth/require-profile";
import { createLifecyclePageActions } from "../page-lifecycle-actions";

const pageId = "11111111-1111-4111-8111-111111111111";
const revisionId = "22222222-2222-4222-8222-222222222222";

function formData(name: "pageId" | "revisionId", value: string) {
  const data = new FormData();
  data.set(name, value);
  return data;
}

function createDependencies() {
  return {
    archive: vi.fn(async (): Promise<{ error: unknown }> => ({ error: null })),
    loadPageSlug: vi.fn(async (): Promise<{ data: { slug: string; status: "draft" | "published" | "archived" } | null; error: unknown }> => ({ data: { slug: "accueil", status: "archived" }, error: null })),
    remove: vi.fn(async (): Promise<{ error: unknown; count: number | null }> => ({ error: null, count: 1 })),
    loadRevisionPageId: vi.fn(async () => ({ data: { page_id: pageId }, error: null })),
    publish: vi.fn(async (): Promise<{ error: unknown }> => ({ error: null })),
    requireProfile: vi.fn(async (): Promise<Profile> => ({
      id: "33333333-3333-4333-8333-333333333333",
      displayName: "Admin",
      role: "admin",
      notifyOnPublish: false,
    })),
    restore: vi.fn(async (): Promise<{ error: unknown }> => ({ error: null })),
    revalidatePath: vi.fn(),
  };
}

describe("page lifecycle actions", () => {
  let dependencies: ReturnType<typeof createDependencies>;

  beforeEach(() => {
    dependencies = createDependencies();
  });

  test("rejects editor publication before page access or mutation", async () => {
    dependencies.requireProfile.mockResolvedValue({
      id: "44444444-4444-4444-8444-444444444444",
      displayName: "Éditeur",
      role: "editor",
      notifyOnPublish: false,
    });
    const actions = createLifecyclePageActions(dependencies);

    await expect(actions.publishPage({}, formData("pageId", pageId))).resolves.toEqual({
      formError: "Cette action est réservée aux administrateurs et aux gestionnaires.",
    });
    expect(dependencies.loadPageSlug).not.toHaveBeenCalled();
    expect(dependencies.publish).not.toHaveBeenCalled();
  });

  test("returns a French form error when publication fails", async () => {
    dependencies.publish.mockResolvedValue({ error: new Error("rpc failed") });
    const actions = createLifecyclePageActions(dependencies);

    await expect(actions.publishPage({}, formData("pageId", pageId))).resolves.toEqual({
      formError: "La page n’a pas pu être publiée.",
    });
    expect(dependencies.revalidatePath).not.toHaveBeenCalled();
  });

  test.each([
    ["publishPage", "pageId", pageId, "Page publiée et révision créée."],
    ["archivePage", "pageId", pageId, "Page archivée. Son contenu peut maintenant être modifié."],
    ["restorePageRevision", "revisionId", revisionId, "Révision restaurée."],
  ] as const)(
    "%s revalidates the public and administration paths after success",
    async (actionName, field, id, success) => {
      const actions = createLifecyclePageActions(dependencies);

      await expect(actions[actionName]({}, formData(field, id))).resolves.toEqual({ success });
      // Pages appear in every footer's site map: the whole site is refreshed.
      expect(dependencies.revalidatePath.mock.calls).toEqual([["/", "layout"]]);
    },
  );
});

test("refuses to archive a site page, whose route would fall back to the original text", async () => {
  const dependencies = createDependencies();
  dependencies.loadPageSlug.mockResolvedValue({ data: { slug: "qui-sommes-nous", status: "published" }, error: null });
  const actions = createLifecyclePageActions(dependencies);

  const state = await actions.archivePage({}, formData("pageId", "11111111-1111-4111-8111-111111111111"));

  expect(dependencies.archive).not.toHaveBeenCalled();
  expect(state.formError).toMatch(/ne peuvent pas être archivées/);
});

describe("page lifecycle actions for a manager", () => {
  let dependencies: ReturnType<typeof createDependencies>;
  const manager: Profile = { id: "55555555-5555-4555-8555-555555555555", displayName: "Gestion", role: "manager", notifyOnPublish: false };

  beforeEach(() => {
    dependencies = createDependencies();
    dependencies.requireProfile.mockResolvedValue(manager);
  });

  test("lets a manager publish a page", async () => {
    const state = await createLifecyclePageActions(dependencies).publishPage({}, formData("pageId", pageId));

    expect(dependencies.publish).toHaveBeenCalledWith(pageId);
    expect(state.success).toBeDefined();
  });

  test("lets a manager restore a revision", async () => {
    const state = await createLifecyclePageActions(dependencies).restorePageRevision({}, formData("revisionId", revisionId));

    expect(dependencies.restore).toHaveBeenCalledWith(revisionId);
    expect(state.success).toBeDefined();
  });

  test("keeps deleting a page for administrators", async () => {
    const state = await createLifecyclePageActions(dependencies).deletePage({}, formData("pageId", pageId));

    expect(dependencies.remove).not.toHaveBeenCalled();
    expect(state.formError).toBe("Cette action est réservée aux administrateurs.");
  });

  test("keeps archiving a page for administrators", async () => {
    const state = await createLifecyclePageActions(dependencies).archivePage({}, formData("pageId", pageId));

    expect(dependencies.archive).not.toHaveBeenCalled();
    expect(state.formError).toBe("Cette action est réservée aux administrateurs.");
  });
});

describe("deleting an archived page", () => {
  let dependencies: ReturnType<typeof createDependencies>;

  beforeEach(() => {
    dependencies = createDependencies();
  });

  test("an administrator deletes an archived page for good", async () => {
    const state = await createLifecyclePageActions(dependencies).deletePage({}, formData("pageId", pageId));

    expect(dependencies.remove).toHaveBeenCalledWith(pageId);
    expect(dependencies.revalidatePath).toHaveBeenCalled();
    expect(state).toEqual({ success: "Page supprimée définitivement." });
  });

  test("refuses a page that is not archived", async () => {
    dependencies.loadPageSlug.mockResolvedValue({ data: { slug: "sortie", status: "published" }, error: null });
    const state = await createLifecyclePageActions(dependencies).deletePage({}, formData("pageId", pageId));

    expect(dependencies.remove).not.toHaveBeenCalled();
    expect(state.formError).toBe("Archivez d’abord la page avant de la supprimer.");
  });

  test("says so when the database kept the page, which still has sub-pages", async () => {
    dependencies.remove.mockResolvedValue({ error: null, count: 0 });
    const state = await createLifecyclePageActions(dependencies).deletePage({}, formData("pageId", pageId));

    expect(state.formError).toBe("La page n’a pas pu être supprimée. Si d’autres pages l’ont pour page parente, changez d’abord leur page parente.");
  });
});
