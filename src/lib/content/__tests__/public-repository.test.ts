import { afterEach, describe, expect, test, vi } from "vitest";
import type { Json } from "@/lib/database.types";
import {
  createSupabasePublicContentRepository,
  type PublicContentQueryClient,
} from "../supabase-public-content-repository";
import { getPublicContentRepository } from "../public-repository";
import { publicContentRepository as localRepository } from "../local-public-content-repository";

const paragraphContent: Json = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Introduction détaillée." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Accueil" }] },
    { type: "paragraph", content: [{ type: "text", text: "Texte de section." }] },
  ],
};

function queryClient(overrides: Partial<PublicContentQueryClient> = {}): PublicContentQueryClient {
  return {
    getPublishedPages: vi.fn().mockResolvedValue({
      data: [{ slug: "nouvelle-page", title: "Nouvelle page", summary: "Résumé", content: paragraphContent }],
      error: null,
    }),
    getPublishedNews: vi.fn().mockResolvedValue({
      data: [{
        id: "news-1",
        title: "Actualité",
        excerpt: "Résumé",
        starts_at: "2026-10-16T08:30:00+00:00",
        ends_at: null,
        featured: true,
        status: "published",
      }],
      error: null,
    }),
    ...overrides,
  };
}

afterEach(() => vi.restoreAllMocks());

describe("getPublicContentRepository", () => {
  test.each([
    {},
    { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" },
    { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "key" },
  ])("uses local content when Supabase configuration is incomplete", (env) => {
    expect(getPublicContentRepository({ env })).toBe(localRepository);
  });

  test("uses Supabase only when both public variables exist", () => {
    const configuredRepository = { ...localRepository };
    const createConfigured = vi.fn(() => configuredRepository);

    expect(getPublicContentRepository({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "key",
      },
      createConfigured,
    })).toBe(configuredRepository);
    expect(createConfigured).toHaveBeenCalledOnce();
  });
});

describe("Supabase public content mapping", () => {
  test("maps published pages and news to public models", async () => {
    const client = queryClient();
    const repository = createSupabasePublicContentRepository(client);

    await expect(repository.getPage("nouvelle-page")).resolves.toEqual({
      slug: "nouvelle-page",
      title: "Nouvelle page",
      introduction: "Résumé",
      sections: [
        { id: "contenu", title: "Contenu", body: "Introduction détaillée." },
        { id: "accueil", title: "Accueil", body: "Texte de section." },
      ],
    });
    await expect(repository.getNews()).resolves.toEqual([
      expect.objectContaining({ id: "news-1", status: "published", featured: true }),
    ]);
    expect(client.getPublishedPages).toHaveBeenCalledWith("nouvelle-page");
  });

  test("fails closed for unsupported rich content", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const repository = createSupabasePublicContentRepository(queryClient({
      getPublishedPages: vi.fn().mockResolvedValue({
        data: [{
          slug: "liste",
          title: "Liste",
          summary: "Résumé",
          content: { type: "doc", content: [{ type: "bulletList" }] },
        }],
        error: null,
      }),
    }));

    await expect(repository.getPage("liste")).rejects.toThrow(/unsupported public page content/i);
    expect(errorSpy).toHaveBeenCalled();
  });

  test("propagates configured query failures instead of using local seed data", async () => {
    const repository = createSupabasePublicContentRepository(queryClient({
      getPublishedNews: vi.fn().mockResolvedValue({ data: null, error: new Error("database unavailable") }),
    }));

    await expect(repository.getNews()).rejects.toThrow("database unavailable");
  });
});
