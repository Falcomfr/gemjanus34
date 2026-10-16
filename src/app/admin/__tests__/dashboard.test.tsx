import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import AdminPage from "../page";

const counts: Record<string, number> = { pages: 2, news: 3, documents: 10, contact_messages: 4, planning_slots: 11 };
const failing = vi.hoisted(() => ({ table: "" }));

vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    from: (table: string) => {
      const result = failing.table === table ? { count: null, error: new Error("down") } : { count: counts[table], error: null };
      const query = {
        select: () => query,
        eq: () => query,
        is: () => query,
        gte: () => query,
        then: (resolve: (value: typeof result) => void) => resolve(result),
      };
      return query;
    },
  })),
}));

test("turns every shortcut into a link with a useful count", async () => {
  render(await AdminPage());

  expect(screen.getByRole("heading", { level: 1, name: "Tableau de bord" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /pages.*2 brouillons/i })).toHaveAttribute("href", "/admin/pages");
  expect(screen.getByRole("link", { name: /actualités.*3 à venir/i })).toHaveAttribute("href", "/admin/actualites");
  expect(screen.getByRole("link", { name: /planning.*11 créneaux/i })).toHaveAttribute("href", "/admin/planning");
  expect(screen.getByRole("link", { name: /documents.*10 en ligne/i })).toHaveAttribute("href", "/admin/documents");
  expect(screen.getByRole("link", { name: /messages.*4 à traiter/i })).toHaveAttribute("href", "/admin/messages");
  expect(screen.getByRole("link", { name: /voir le site/i })).toHaveAttribute("href", "/");
});

test("does not pretend there is nothing to handle when a count fails", async () => {
  failing.table = "contact_messages";
  render(await AdminPage());
  failing.table = "";

  expect(screen.getByRole("link", { name: /messages.*nombre indisponible/i })).toBeInTheDocument();
});
