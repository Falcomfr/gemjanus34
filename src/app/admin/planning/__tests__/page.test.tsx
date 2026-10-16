import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import AdminPlanningPage from "../page";

vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn() }));
vi.mock("../actions", () => ({
  savePlanningSlot: vi.fn(),
  deletePlanningSlot: vi.fn(),
  savePlanningDay: vi.fn(),
  savePlanningSettings: vi.fn(),
}));
const rows: Record<string, unknown[]> = {
  planning_settings: [{ effective_from: "2026-06-22", note: "Ouverture à 13 h." }],
  planning_days: [{ day: 2, opens_at: "13:00:00", closes_at: "18:00:00", team: "Mona et Elif" }],
  planning_slots: [{ id: "50000000-0000-4000-8000-000000000001", day: 2, starts_at: "14:30:00", ends_at: "15:30:00", title: "Qi Gong", leader: "Adrien", note: "", family: "bouger", recurrence: "weekly", month_weeks: [] }],
  planning_exceptions: [],
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
