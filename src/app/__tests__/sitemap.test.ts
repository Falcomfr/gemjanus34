import { afterEach, expect, test, vi } from "vitest";
import { publicContentRepository } from "@/lib/content/local-public-content-repository";
import { defaultSiteSettings } from "@/lib/settings/site-settings";
import * as siteSettings from "@/lib/settings/site-settings";
import sitemap from "../sitemap";

vi.mock("@/lib/settings/site-settings", async (original) => ({
  ...(await original<typeof import("@/lib/settings/site-settings")>()),
  getSiteSettings: vi.fn(),
}));

afterEach(() => vi.restoreAllMocks());

test("lists the fixed routes and every other published page once", async () => {
  vi.mocked(siteSettings.getSiteSettings).mockResolvedValue(defaultSiteSettings);
  vi.spyOn(publicContentRepository, "getPageLinks").mockResolvedValue([
    { slug: "activites", title: "Activités", parentId: null },
    { slug: "sortie-au-musee", title: "Sortie", parentId: null },
  ]);

  const urls = (await sitemap()).map((entry) => entry.url);

  expect(urls.filter((url) => url.endsWith("/activites"))).toHaveLength(1);
  expect(urls).toContain("https://gemjanus34.fr/sortie-au-musee");
  expect(urls).toContain("https://gemjanus34.fr/planning");
  expect(urls).not.toContain("https://gemjanus34.fr/galerie");
  expect(urls).not.toContain("https://gemjanus34.fr/conferences");
  expect(urls).toHaveLength(11);
});

test("lists the gallery and the conferences only once switched on", async () => {
  vi.mocked(siteSettings.getSiteSettings).mockResolvedValue({ ...defaultSiteSettings, galleryEnabled: true, conferencesEnabled: true });
  vi.spyOn(publicContentRepository, "getPageLinks").mockResolvedValue([]);

  const urls = (await sitemap()).map((entry) => entry.url);

  expect(urls).toContain("https://gemjanus34.fr/galerie");
  expect(urls).toContain("https://gemjanus34.fr/conferences");
});
