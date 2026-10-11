import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/content/seed", async (importOriginal) => {
  const seed = await importOriginal<typeof import("@/content/seed")>();

  return {
    ...seed,
    newsItems: [
      {
        id: "equivalent-z",
        title: "Même instant UTC",
        excerpt: "Premier élément équivalent",
        startsAt: "2026-10-15T09:00:00Z",
        endsAt: null,
        featured: false,
        status: "published",
      },
      {
        id: "later-offset",
        title: "Plus tard avec décalage",
        excerpt: "Commence après les deux autres",
        startsAt: "2026-10-15T10:30:00+01:00",
        endsAt: null,
        featured: false,
        status: "published",
      },
      {
        id: "equivalent-offset",
        title: "Même instant décalé",
        excerpt: "Second élément équivalent",
        startsAt: "2026-10-15T11:00:00+02:00",
        endsAt: null,
        featured: false,
        status: "published",
      },
    ],
  };
});

beforeEach(() => {
  vi.resetModules();
});

test("orders repository news by instant across differing and equivalent offsets", async () => {
  const { publicContentRepository } = await import("../local-public-content-repository");
  const news = await publicContentRepository.getNews();

  expect(news.map((item) => item.title)).toEqual([
    "Plus tard avec décalage",
    "Même instant UTC",
    "Même instant décalé",
  ]);
});
