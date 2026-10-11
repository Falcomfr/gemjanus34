import { describe, expect, test } from "vitest";
import { publicDocuments, publicPages } from "../seed";

function getPage(slug: string) {
  const page = publicPages.find((candidate) => candidate.slug === slug);
  expect(page, `Expected public page ${slug}`).toBeDefined();
  return page!;
}

function getPageCopy(slug: string) {
  const page = getPage(slug);
  return [page.introduction, ...page.sections.map((section) => section.body)].join(" ");
}

describe("public content contracts", () => {
  test("keeps institutional and health documents in their intended categories", () => {
    expect(
      publicDocuments
        .filter((document) => document.category === "institutional")
        .map((document) => document.slug),
    ).toEqual(["statuts-association", "reglement-interieur"]);
    expect(
      publicDocuments
        .filter((document) => document.category === "health")
        .map((document) => document.slug),
    ).toEqual(["reperes-trouble-bipolaire", "orientation-professionnel-sante"]);
  });

  test("keeps the healthcare disclaimer explicit", () => {
    const copy = getPageCopy("ressources");

    expect(copy).toMatch(/n'est ni un professionnel de santé ni un service de soins/i);
    expect(copy).toMatch(/ne constituent pas des conseils médicaux/i);
  });

  test.each(["mentions-legales", "confidentialite"])(
    "keeps %s provisional pending association validation",
    (slug) => {
      const page = getPage(slug);

      expect(page.introduction).toMatch(/contenu provisoire/i);
      expect(page.introduction).toMatch(/validation par l'association/i);
      expect(page.introduction).toMatch(/avant la mise en production/i);
    },
  );

  test("gives complete phone-first information for a first visit", () => {
    const page = getPage("nous-rejoindre");
    const copy = getPageCopy("nous-rejoindre");

    expect(page.introduction).toMatch(/avant (?:de venir pour )?une première visite/i);
    expect(page.introduction).toMatch(/contactez l'association par téléphone/i);
    expect(page.introduction).not.toMatch(/ou rendez-vous au/i);
    expect(copy).toMatch(/04 67 04 87 68/);
    expect(copy).toMatch(/405 rue des Grèzes(?:,| à) Montpellier/i);
    expect(copy).toMatch(/ligne(?: de bus)? 11/i);
    expect(copy).toMatch(/La Martelle/i);
    expect(copy).toMatch(/convenir (?:avec vous )?d'un (?:premier accueil|rendez-vous)/i);
  });
});
