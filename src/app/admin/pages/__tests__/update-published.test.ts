import { beforeEach, expect, test, vi } from "vitest";
import { updatePage } from "../actions";

const rpc = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
const profile = vi.hoisted(() => ({ current: { id: "10000000-0000-0000-0000-000000000001", role: "admin" } }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn(async () => profile.current) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    rpc,
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { slug: "activites", status: "published", navigation_position: null, parent_id: null },
            error: null,
          }),
        }),
      }),
      update: (values: unknown) => ({ eq: () => update(values) }),
    }),
  })),
}));

function form() {
  const data = new FormData();
  data.set("pageId", "11111111-1111-4111-8111-111111111111");
  data.set("title", "Activités");
  data.set("slug", "activites");
  data.set("summary", "Le programme de la semaine.");
  data.set("content", JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Corrigé" }] }] }));
  data.set("status", "published");
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  profile.current = { id: "10000000-0000-0000-0000-000000000001", role: "admin" };
});

test("corrects a published page in place for an administrator", async () => {
  rpc.mockResolvedValue({ error: null });
  update.mockResolvedValue({ error: null });

  const state = await updatePage({}, form());

  expect(rpc).toHaveBeenCalledWith("update_published_page", {
    page_id: "11111111-1111-4111-8111-111111111111",
    new_title: "Activités",
    new_summary: "Le programme de la semaine.",
    new_content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Corrigé" }] }] },
  });
  expect(state.success).toMatch(/en ligne/);
});

test("tells an editor that only an administrator corrects a published page", async () => {
  profile.current = { id: "10000000-0000-0000-0000-000000000002", role: "editor" };

  const state = await updatePage({}, form());

  expect(rpc).not.toHaveBeenCalled();
  expect(state.formError).toMatch(/administrateur/);
});

test("keeps the address of a site page fixed", async () => {
  const data = form();
  data.set("slug", "nos-activites");

  const state = await updatePage({}, data);

  expect(rpc).not.toHaveBeenCalled();
  expect(state.fieldErrors?.slug?.[0]).toMatch(/ne peut pas changer/);
});
