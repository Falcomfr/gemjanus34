import { beforeEach, expect, test, vi } from "vitest";
import { updateNews } from "../actions";

const rpc = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock("@/lib/auth/require-profile", () => ({
  requireProfile: vi.fn(async () => ({ id: "10000000-0000-0000-0000-000000000002", role: "editor" })),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    rpc,
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: { status: "published" }, error: null }) }) }),
    }),
  })),
}));

beforeEach(() => vi.clearAllMocks());

test("corrects a published news item in place", async () => {
  rpc.mockResolvedValue({ error: null });
  const data = new FormData();
  data.set("newsId", "40000000-0000-4000-8000-000000000001");
  data.set("title", "Sortie corrigée");
  data.set("excerpt", "Nouveau lieu de rendez-vous.");
  data.set("content", JSON.stringify({ type: "doc", content: [] }));
  data.set("startsAt", "2030-03-10T14:00");

  const state = await updateNews({}, data);

  expect(rpc).toHaveBeenCalledWith("update_published_news", expect.objectContaining({
    news_id: "40000000-0000-4000-8000-000000000001",
    new_title: "Sortie corrigée",
    new_excerpt: "Nouveau lieu de rendez-vous.",
    new_ends_at: null,
    new_featured: false,
  }));
  expect(state.success).toMatch(/en ligne/);
});
