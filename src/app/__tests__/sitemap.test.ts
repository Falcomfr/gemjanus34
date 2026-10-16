import { afterEach, expect, test, vi } from "vitest";
import { publicContentRepository } from "@/lib/content/local-public-content-repository";
import sitemap from "../sitemap";

afterEach(() => vi.restoreAllMocks());

test("lists the fixed routes and every other published page once", async () => {
  vi.spyOn(publicContentRepository, "getPageLinks").mockResolvedValue([
    { slug: "activites", title: "Activités" },
    { slug: "sortie-au-musee", title: "Sortie" },
  ]);

  const urls = (await sitemap()).map((entry) => entry.url);

  expect(urls.filter((url) => url.endsWith("/activites"))).toHaveLength(1);
  expect(urls).toContain("https://gemjanus34.fr/sortie-au-musee");
  expect(urls).toHaveLength(10);
});
