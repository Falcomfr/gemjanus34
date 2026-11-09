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
