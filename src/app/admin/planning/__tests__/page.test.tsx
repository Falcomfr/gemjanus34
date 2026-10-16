import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import AdminPlanningPage from "../page";

vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn() }));
vi.mock("../actions", () => ({
  savePlanningSlot: vi.fn(),
  deletePlanningSlot: vi.fn(),
  savePlanningDay: vi.fn(),
  savePlanningSettings: vi.fn(),
  addPlanningException: vi.fn(),
  deletePlanningException: vi.fn(),
}));
const rows: Record<string, unknown[]> = {
  planning_settings: [{ effective_from: "2026-06-22", note: "Ouverture à 13 h." }],
  planning_days: [{ day: 2, opens_at: "13:00:00", closes_at: "18:00:00", team: "Mona et Elif" }],
  planning_slots: [{ id: "50000000-0000-4000-8000-000000000001", day: 2, starts_at: "14:30:00", ends_at: "15:30:00", title: "Qi Gong", leader: "Adrien", note: "", family: "bouger", recurrence: "weekly", month_weeks: [] }],
  planning_exceptions: [
    { id: "60000000-0000-4000-8000-000000000001", kind: "cancel", date: "2030-01-08", end_date: null, slot_id: "50000000-0000-4000-8000-000000000001", hidden: false, reason: "Adrien absent", starts_at: null, ends_at: null, title: null, leader: "", description: "", family: null },
    { id: "60000000-0000-4000-8000-000000000002", kind: "closure", date: "2030-12-24", end_date: "2031-01-02", slot_id: null, hidden: false, reason: "Fêtes", starts_at: null, ends_at: null, title: null, leader: "", description: "", family: null },
  ],
};
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    from: (table: string) => {
      const result = { data: rows[table], error: null };
      const query = { select: () => query, limit: () => query, gte: () => query, then: (resolve: (value: typeof result) => void) => resolve(result) };
      return query;
    },
  })),
}));

test("lets the team edit every part of the planning", async () => {
  render(await AdminPlanningPage());

  expect(screen.getByRole("heading", { level: 1, name: "Planning" })).toBeInTheDocument();
  expect(screen.getByLabelText("En vigueur à partir du")).toHaveValue("2026-06-22");
  const tuesday = screen.getByRole("region", { name: "Mardi" });
  expect(within(tuesday).getByLabelText("Équipe présente")).toHaveValue("Mona et Elif");
  expect(within(tuesday).getByDisplayValue("Qi Gong")).toBeInTheDocument();
  expect(within(tuesday).getByRole("button", { name: "Supprimer Qi Gong" })).toBeInTheDocument();
  expect(within(tuesday).getByRole("button", { name: "Ajouter le créneau" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /version imprimable/i })).toHaveAttribute("href", "/planning/imprimer");
});

test("lists the planned changes and offers to cancel, close or add a session", async () => {
  render(await AdminPlanningPage());

  const changes = screen.getByRole("region", { name: "Changements à venir" });
  const items = within(changes).getAllByRole("listitem");
  expect(items[0]).toHaveTextContent("Mardi 8 janvier 2030");
  expect(items[0]).toHaveTextContent("Qi Gong");
  expect(items[0]).toHaveTextContent("Annulée, barrée");
  expect(items[0]).toHaveTextContent("Adrien absent");
  expect(items[1]).toHaveTextContent("Du 24 décembre 2030 au 2 janvier 2031");
  expect(items[1]).toHaveTextContent("GEM fermé");
  expect(within(changes).getAllByRole("button", { name: /^supprimer/i })).toHaveLength(2);
  expect(within(changes).getByText("Annuler une séance")).toBeInTheDocument();
  expect(within(changes).getByText("Fermer le GEM")).toBeInTheDocument();
  expect(within(changes).getByText("Ajouter une séance exceptionnelle")).toBeInTheDocument();
  expect(within(changes).getByRole("option", { name: "Mardi · 14 h 30 · Qi Gong" })).toBeInTheDocument();
});

test("sets the recurrence of each slot", async () => {
  render(await AdminPlanningPage());

  const tuesday = screen.getByRole("region", { name: "Mardi" });
  expect(within(tuesday).getAllByLabelText("Récurrence")[0]).toHaveValue("weekly");
  expect(within(tuesday).getAllByRole("checkbox", { name: "Dernière" })[0]).not.toBeChecked();
});
