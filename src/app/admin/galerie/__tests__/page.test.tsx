import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import AdminGalleryPage from "../page";

const settings = vi.hoisted(() => ({ galleryEnabled: false }));
vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn(async () => ({ id: "u1", role: "editor" })) }));
vi.mock("../actions", () => ({ uploadGalleryItem: vi.fn(), deleteGalleryItem: vi.fn() }));
vi.mock("@/lib/settings/site-settings", () => ({ getSiteSettings: vi.fn(async () => settings) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        order: async () => ({
          data: [
            { id: "g1", kind: "image", title: "Le phare", author: "Lou", workshop: "Linogravure", image_url: "https://cdn.test/gallery/phare.jpg", created_at: "2026-11-09T10:00:00Z" },
            { id: "g2", kind: "text", title: "La mer", author: null, workshop: "Écriture", image_url: null, created_at: "2026-11-09T09:00:00Z" },
          ],
          error: null,
        }),
      }),
    }),
  })),
}));

test("lists the creations with their photo and a delete button", async () => {
  render(await AdminGalleryPage());

  const item = screen.getAllByRole("listitem")[0]!;
  expect(within(item).getByRole("img", { name: "Le phare" })).toHaveAttribute("src", expect.stringContaining("phare.jpg"));
  expect(item).toHaveTextContent("Lou · Linogravure");
  expect(within(item).getByRole("button", { name: /supprimer le phare/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/l’auteur a donné son accord/i)).toBeRequired();
});

test("says the gallery is not shown on the site while switched off", async () => {
  render(await AdminGalleryPage());

  expect(screen.getByText(/pas encore visible sur le site/i)).toBeInTheDocument();
});

test("lists a text with its kind instead of a photo", async () => {
  render(await AdminGalleryPage());

  const poem = screen.getAllByRole("listitem")[1]!;
  expect(within(poem).queryByRole("img")).not.toBeInTheDocument();
  expect(poem).toHaveTextContent("Texte · Écriture");
});

test("asks for the words or the file depending on the kind of creation", async () => {
  render(await AdminGalleryPage());

  expect(screen.getByLabelText(/photo jpeg/i)).toBeRequired();
  fireEvent.click(screen.getByRole("radio", { name: "Texte" }));
  expect(screen.getByLabelText(/texte de la création/i)).toBeRequired();
  expect(screen.queryByLabelText(/photo jpeg/i)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("radio", { name: "PDF" }));
  expect(screen.getByLabelText(/fichier pdf/i)).toHaveAttribute("accept", "application/pdf");
});
