import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { newsItems, publicDocuments, publicPages } from "../seed";

function getPage(slug: string) {
  const page = publicPages.find((candidate) => candidate.slug === slug);
  expect(page, `Expected public page ${slug}`).toBeDefined();
  return page!;
}

function getPageCopy(slug: string) {
  const page = getPage(slug);
  return [
    page.introduction,
    ...page.sections.flatMap((section) => [section.body, ...(section.items ?? [])]),
  ].join(" ");
}

describe("public content contracts", () => {
  test("keeps institutional and health documents in their intended categories", () => {
    expect(
      publicDocuments
        .filter((document) => document.category === "institutional")
        .map((document) => document.slug),
    ).toEqual([
      "statuts-association",
      "reglement-interieur",
      "regles-de-vie",
      "compte-rendu-ag-2025",
    ]);
    expect(
      publicDocuments
        .filter((document) => document.category === "health")
        .map((document) => document.slug),
    ).toEqual([
      "questions-reponses-troubles-bipolaires",
      "connaitre-trouble-bipolaire",
      "vivre-avec-troubles-bipolaires",
      "conseils-entourage",
      "diagramme-humeur",
    ]);
  });

  test("points every document download to a bundled file", () => {
    for (const document of publicDocuments) {
      expect(document.downloadUrl).toBe(`/documents/${document.slug}.pdf`);
      expect(existsSync(join(process.cwd(), "public", document.downloadUrl)), document.slug).toBe(true);
    }
  });

  test("keeps the healthcare disclaimer explicit", () => {
    const copy = getPageCopy("ressources");

    expect(copy).toMatch(/n'est ni un professionnel de santé ni un service de soins/i);
    expect(copy).toMatch(/ne constituent pas des conseils médicaux/i);
  });

  test.each(["qui-sommes-nous", "activites", "nous-rejoindre", "ressources", "mentions-legales", "confidentialite"])(
    "gives %s substantial content",
    (slug) => {
      const page = getPage(slug);
      const copy = getPageCopy(slug);

      expect(page.sections.length).toBeGreaterThanOrEqual(4);
      expect(copy.length).toBeGreaterThanOrEqual(1000);
    },
  );

  test("shows no migration or placeholder vocabulary on any page", () => {
    const allCopy = JSON.stringify([publicPages, publicDocuments, newsItems]);

    expect(allCopy).not.toMatch(
      /importé|ancien site|mise à jour éditoriale|contenu provisoire|en attente de validation|validation requise/i,
    );
    expect(allCopy).not.toContain("\u2014");
    expect(allCopy).not.toContain("—");
  });

  test("names the actual host and publisher in the legal notice", () => {
    const copy = JSON.stringify(getPage("mentions-legales"));

    expect(copy).toContain("Vercel Inc.");
    expect(copy).toContain("405 rue des Grèzes, 34070 Montpellier");
    expect(copy).toContain("04 67 04 87 68");
  });

  test("describes what the contact form really does with data", () => {
    const copy = getPageCopy("confidentialite");

    expect(copy).toMatch(/nom, adresse e-mail, objet et message/);
    expect(copy).toMatch(/répondre à votre demande/);
    expect(copy).toMatch(/seule l'équipe de Janus34/i);
    expect(copy).toMatch(/au plus tard au bout de 3 ans/);
    expect(copy).not.toMatch(/pas encore ouvert/);
    expect(copy).toMatch(/CNIL/);
  });

  test("keeps everything the original site explained", () => {
    expect(getPageCopy("ressources")).toMatch(/tristesse intense/);
    expect(getPageCopy("ressources")).toMatch(/euphorie excessive/);
    expect(getPageCopy("activites")).toMatch(/Favoriser l'échange entre adhérents/);
    expect(getPageCopy("activites")).toMatch(/poser vos questions aux intervenants/);
    expect(getPageCopy("ressources")).toMatch(/Culture et Sport Solidaires 34/);
    expect(getPageCopy("qui-sommes-nous")).toMatch(/une animatrice est présente un samedi par mois/i);
    expect(getPageCopy("qui-sommes-nous")).toMatch(/une face tournée vers le passé/);
    expect(JSON.stringify(getPage("nous-rejoindre"))).toContain("https://www.google.com/maps/search/?api=1&query=");
  });

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
