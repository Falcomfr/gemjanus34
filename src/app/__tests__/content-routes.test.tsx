import { afterEach, describe, expect, test, vi } from "vitest";
import type { PublicPage } from "@/content/types";
import { publicContentRepository } from "@/lib/content/local-public-content-repository";
import ActivitiesPage from "../activites/page";
import PrivacyPage from "../confidentialite/page";
import LegalNoticePage from "../mentions-legales/page";
import JoinPage from "../nous-rejoindre/page";
import AboutPage from "../qui-sommes-nous/page";
import ResourcesPage from "../ressources/page";

const page: PublicPage = {
  slug: "test",
  title: "Test",
  introduction: "Test",
  sections: [],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("public content routes", () => {
  test.each([
    ["qui-sommes-nous", AboutPage],
    ["activites", ActivitiesPage],
    ["nous-rejoindre", JoinPage],
    ["ressources", ResourcesPage],
    ["mentions-legales", LegalNoticePage],
    ["confidentialite", PrivacyPage],
  ])("requests the exact %s page slug", async (slug, route) => {
    const getPage = vi.spyOn(publicContentRepository, "getPage").mockResolvedValue(page);
    vi.spyOn(publicContentRepository, "getDocuments").mockResolvedValue([]);

    await route();

    expect(getPage).toHaveBeenCalledOnce();
    expect(getPage).toHaveBeenCalledWith(slug);
  });

  test.each([
    ["institutional", AboutPage],
    ["health", ResourcesPage],
  ] as const)("places %s documents on the matching route", async (category, route) => {
    vi.spyOn(publicContentRepository, "getPage").mockResolvedValue(page);
    const getDocuments = vi
      .spyOn(publicContentRepository, "getDocuments")
      .mockResolvedValue([]);

    await route();

    expect(getDocuments).toHaveBeenCalledOnce();
    expect(getDocuments).toHaveBeenCalledWith(category);
  });
});
