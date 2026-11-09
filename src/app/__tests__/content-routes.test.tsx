import { afterEach, describe, expect, test, vi } from "vitest";
import type { PublicPage } from "@/content/types";
import { publicContentRepository } from "@/lib/content/local-public-content-repository";
import ActivitiesPage, { generateMetadata as activitiesMetadata } from "../activites/page";
import PrivacyPage, { generateMetadata as privacyMetadata } from "../confidentialite/page";
import LegalNoticePage, { generateMetadata as legalMetadata } from "../mentions-legales/page";
import JoinPage, { generateMetadata as joinMetadata } from "../nous-rejoindre/page";
import AboutPage, { generateMetadata as aboutMetadata } from "../qui-sommes-nous/page";
import ResourcesPage, { generateMetadata as resourcesMetadata } from "../ressources/page";

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
    ["activity", ActivitiesPage],
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

test("always shows the health notice on the resources page", async () => {
  const { render, screen } = await import("@testing-library/react");
  vi.spyOn(publicContentRepository, "getPage").mockResolvedValue({
    slug: "ressources",
    title: "Ressources",
    introduction: "Une page réduite à un paragraphe.",
    sections: [{ id: "contenu", title: "Contenu", body: "Texte." }],
  });
  vi.spyOn(publicContentRepository, "getDocuments").mockResolvedValue([]);

  render(await ResourcesPage());

  expect(screen.getByRole("note")).toHaveTextContent(
    /ne remplacent pas l'avis d'un professionnel de santé/i,
  );
});

test("puts the practical information first on the first visit page", async () => {
  const { render, screen } = await import("@testing-library/react");
  vi.spyOn(publicContentRepository, "getPage").mockResolvedValue(page);

  render(await JoinPage());
  const practical = screen.getByRole("region", { name: "Informations pratiques" });

  expect(practical).toHaveTextContent("405 rue des Grèzes");
  expect(practical).toHaveTextContent("Bus 11, arrêt La Martelle");
  expect(practical).toHaveTextContent("13 h");
  expect(practical.querySelector('a[href="tel:+33467048768"]')).not.toBeNull();
  expect(practical.querySelector('a[href^="https://www.google.com/maps/search/"]')).toHaveTextContent(/carte/i);
});

test.each([
  ["qui-sommes-nous", AboutPage, "L'association", /buste en marbre de janus/i],
  ["activites", ActivitiesPage, "La vie au GEM", /peinture aux couleurs vives/i],
] as const)("keeps the %s eyebrow and header image whatever the stored content", async (_slug, route, eyebrow, image) => {
  const { render, screen } = await import("@testing-library/react");
  vi.spyOn(publicContentRepository, "getPage").mockResolvedValue({ ...page, eyebrow: undefined });
  vi.spyOn(publicContentRepository, "getDocuments").mockResolvedValue([]);

  render(await route());

  expect(screen.getByText(eyebrow)).toBeInTheDocument();
  expect(screen.getByRole("img", { name: image })).toBeInTheDocument();
});

test.each([
  ["qui-sommes-nous", aboutMetadata],
  ["activites", activitiesMetadata],
  ["nous-rejoindre", joinMetadata],
  ["ressources", resourcesMetadata],
  ["mentions-legales", legalMetadata],
  ["confidentialite", privacyMetadata],
] as const)("gives the %s page its own title and description", async (_slug, generateMetadata) => {
  vi.spyOn(publicContentRepository, "getPage").mockResolvedValue({ ...page, title: "Titre de la page", introduction: "Résumé de la page" });

  await expect(generateMetadata()).resolves.toEqual({ title: "Titre de la page", description: "Résumé de la page" });
});

test("the privacy page covers the call-me-back form, e-mail copies, statistics and backups", async () => {
  const privacy = await publicContentRepository.getPage("confidentialite");
  const text = JSON.stringify(privacy);

  for (const expected of ["numéro de téléphone", "Resend", "Cloudflare Web Analytics", "90 jours"]) expect(text).toContain(expected);
});
