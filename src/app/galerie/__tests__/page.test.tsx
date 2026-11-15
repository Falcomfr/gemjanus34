import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import GalleryPage from "../page";

const settings = vi.hoisted(() => ({ current: { galleryEnabled: true } }));
const notFound = vi.hoisted(() => vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/lib/settings/site-settings", () => ({ getSiteSettings: vi.fn(async () => settings.current) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        order: async () => ({
          data: [
            { id: "g1", title: "Le phare", author: "Lou", workshop: "Linogravure", image_url: "https://cdn.test/gallery/phare.jpg" },
            { id: "g2", title: "Sans titre", author: null, workshop: null, image_url: "https://cdn.test/gallery/x.png" },
            { id: "g3", kind: "text", title: "La mer", author: "Sam", workshop: "Écriture", body: "La mer\nau loin", image_url: null },
            { id: "g4", kind: "pdf", title: "Recueil", author: null, workshop: "Écriture", body: null, image_url: "https://cdn.test/gallery/recueil.pdf" },
          ],
          error: null,
        }),
      }),
    }),
  })),
}));

beforeEach(() => {
  settings.current = { galleryEnabled: true };
});

test("shows each creation with its photo, author and workshop", async () => {
  render(await GalleryPage());

  expect(screen.getByRole("heading", { level: 1, name: "Galerie des créations" })).toBeInTheDocument();
  const [phare, other] = screen.getAllByRole("figure");
  expect(within(phare!).getByRole("img", { name: "Le phare" })).toHaveAttribute("src", "https://cdn.test/gallery/phare.jpg");
  expect(phare).toHaveTextContent("par Lou");
  expect(phare).toHaveTextContent("Linogravure");
  expect(other).not.toHaveTextContent("par");
});

test("does not exist while the gallery is switched off", async () => {
  settings.current = { galleryEnabled: false };

  await expect(GalleryPage()).rejects.toThrow("NEXT_NOT_FOUND");
});

const params = (value: Record<string, string>) => ({ searchParams: Promise.resolve(value) });

test("shows a pasted text in full, line by line, and a PDF in its reader", async () => {
  render(await GalleryPage());

  const poem = screen.getByRole("article", { name: "La mer" });
  expect(within(poem).getByText(/La mer\s+au loin/)).toHaveClass("gallery-writing__body");
  expect(poem).toHaveTextContent("par Sam");
  const recueil = screen.getByRole("article", { name: "Recueil" });
  expect(within(recueil).getByRole("link", { name: /ouvrir en grand/i })).toHaveAttribute("href", "https://cdn.test/gallery/recueil.pdf");
});

test("filters the works or the writings", async () => {
  render(await GalleryPage(params({ type: "ecrits" })));
  expect(screen.queryAllByRole("figure")).toHaveLength(0);
  expect(screen.getAllByRole("article", { name: /.+/ })).toHaveLength(2);
  expect(screen.getByRole("link", { name: "Écrits" })).toHaveAttribute("aria-current", "page");
});

test("filters by workshop and keeps the chosen type in the links", async () => {
  render(await GalleryPage(params({ type: "oeuvres", atelier: "Linogravure" })));
  expect(screen.getAllByRole("figure")).toHaveLength(1);
  expect(screen.queryAllByRole("article", { name: /.+/ })).toHaveLength(0);
  expect(screen.getByRole("link", { name: "Écriture" })).toHaveAttribute("href", "/galerie?type=oeuvres&atelier=%C3%89criture");
  expect(screen.getByRole("link", { name: "Tous les ateliers" })).toHaveAttribute("href", "/galerie?type=oeuvres");
});

test("says when nothing matches the filters", async () => {
  render(await GalleryPage(params({ type: "ecrits", atelier: "Linogravure" })));
  expect(screen.getByText(/aucune création ne correspond/i)).toBeInTheDocument();
});
