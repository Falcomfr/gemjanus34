import { render, screen, within } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import type { PublicDocument } from "@/content/types";
import { publicContentRepository } from "@/lib/content/local-public-content-repository";
import HomePage from "../page";

const forbiddenWording = /importé|ancien site|mise à jour éditoriale|contenu provisoire|en attente de validation/i;

function planningDocument(id: string, updatedAt: string): PublicDocument {
  return {
    id,
    title: id,
    slug: id,
    description: id,
    category: "planning",
    mimeType: "application/pdf",
    updatedAt,
    downloadUrl: `/documents/${id}.pdf`,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

test("opens on the association promise and its two main actions", async () => {
  render(await HomePage());
  const hero = screen.getByRole("region", { name: "Rompre les solitudes, créer des liens" });

  expect(screen.getByRole("heading", { level: 1, name: "Rompre les solitudes, créer des liens" })).toBeInTheDocument();
  expect(hero).toHaveTextContent("Janus34");
  expect(within(hero).getByRole("link", { name: /découvrir janus34/i })).toHaveAttribute("href", "/qui-sommes-nous");
  expect(within(hero).getByRole("link", { name: /préparer une première visite/i })).toHaveAttribute(
    "href",
    "/nous-rejoindre",
  );
});

test("gives immediate access to the planning, the visit and the phone", async () => {
  render(await HomePage());
  const quickAccess = screen.getByRole("navigation", { name: "Accès rapides" });

  expect(within(quickAccess).getByRole("link", { name: /le planning/i })).toHaveAttribute("href", "/actualites#planning");
  expect(within(quickAccess).getByRole("link", { name: /venir au gem/i })).toHaveAttribute("href", "/nous-rejoindre");
  expect(within(quickAccess).getByRole("link", { name: /04 67 04 87 68/ })).toHaveAttribute("href", "tel:+33467048768");
  expect(within(quickAccess).getByText(/405 rue des grèzes/i)).toBeInTheDocument();
});

test("explains the collective project and the three activity families", async () => {
  render(await HomePage());

  expect(screen.getByRole("heading", { level: 2, name: "Un espace d'entraide, pas un lieu de soins" })).toBeInTheDocument();
  for (const family of ["Créer et s'exprimer", "Bouger et prendre l'air", "Échanger et agir ensemble"]) {
    expect(screen.getByRole("heading", { level: 3, name: family })).toBeInTheDocument();
  }
});

test("shows what happens at the GEM today from the planning", async () => {
  render(await HomePage());

  expect(screen.getByRole("region", { name: /au GEM$/ })).toHaveTextContent("13 h – 18 h");
  expect(screen.getByRole("link", { name: /tout le planning de la semaine/i })).toHaveAttribute("href", "/actualites#planning");
});

test("falls back to the most recent planning PDF when no planning is stored", async () => {
  vi.spyOn(publicContentRepository, "getPlanning").mockResolvedValue(null);
  vi.spyOn(publicContentRepository, "getDocuments").mockResolvedValueOnce([
    planningDocument("planning-precedent", "2026-09-15"),
    planningDocument("dernier-planning", "2026-10-10"),
    planningDocument("planning-intermediaire", "2026-10-01"),
  ]);

  render(await HomePage());

  expect(screen.getByRole("link", { name: /consulter le planning \(pdf\)/i })).toHaveAttribute(
    "href",
    "/documents/dernier-planning.pdf",
  );
});

test("keeps the planning access useful when no planning is available", async () => {
  vi.spyOn(publicContentRepository, "getPlanning").mockResolvedValue(null);
  vi.spyOn(publicContentRepository, "getDocuments").mockResolvedValueOnce([]);

  render(await HomePage());

  expect(screen.queryByRole("link", { name: /consulter le planning/i })).not.toBeInTheDocument();
  expect(screen.getByText(/le planning est disponible auprès de l'équipe/i)).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "Accès rapides" })).toBeInTheDocument();
});

test("ends with an invitation to visit or write", async () => {
  render(await HomePage());
  const invitation = screen.getByRole("region", { name: /venir nous rencontrer/i });

  expect(within(invitation).getByRole("link", { name: /préparer une première visite/i })).toHaveAttribute(
    "href",
    "/nous-rejoindre",
  );
  expect(within(invitation).getByRole("link", { name: "Toutes nos coordonnées" })).toHaveAttribute("href", "/contact");
  expect(within(invitation).queryByRole("link", { name: /écrire/i })).not.toBeInTheDocument();
});

test("shows no migration vocabulary", async () => {
  const { container } = render(await HomePage());

  expect(container.textContent).not.toMatch(forbiddenWording);
});

test("refreshes hourly so news status follows the calendar", async () => {
  const home = await import("../page");

  expect(home.revalidate).toBe(3600);
});

test("shows a painting from the GEM in the opening screen", async () => {
  render(await HomePage());
  const hero = screen.getByRole("region", { name: "Rompre les solitudes, créer des liens" });
  const painting = within(hero).getByRole("img", { name: /peinture/i });

  expect(painting).toHaveAttribute("src", expect.stringContaining("peinture-gem"));
});

test("sums up Janus34 in three sourced key figures", async () => {
  render(await HomePage());
  const figures = screen.getByRole("region", { name: "Janus34 en quelques repères" });

  expect(within(figures).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
    "2006année de création de l'association",
    "Lundi → samediouverture du GEM à 13 h",
    "100 %d'adhérents au Conseil d'Administration",
  ]);
});

test("quotes the association's own objective", async () => {
  const { container } = render(await HomePage());

  expect(container.querySelector("blockquote")?.textContent).toContain(
    "Rompre les solitudes, favoriser l'entraide, la solidarité et le partage entre les membres.",
  );
});
