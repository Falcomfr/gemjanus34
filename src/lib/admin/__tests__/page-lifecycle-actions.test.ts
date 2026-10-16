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
    loadPageSlug: vi.fn(async () => ({ data: { slug: "accueil" }, error: null })),
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
      formError: "Cette action est réservée aux administrateurs.",
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
  dependencies.loadPageSlug.mockResolvedValue({ data: { slug: "qui-sommes-nous" }, error: null });
  const actions = createLifecyclePageActions(dependencies);

  const state = await actions.archivePage({}, formData("pageId", "11111111-1111-4111-8111-111111111111"));

  expect(dependencies.archive).not.toHaveBeenCalled();
  expect(state.formError).toMatch(/ne peuvent pas être archivées/);
});
