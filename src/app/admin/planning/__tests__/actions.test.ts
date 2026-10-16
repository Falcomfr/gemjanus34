import { beforeEach, expect, test, vi } from "vitest";
import * as planningActions from "../actions";

const table = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn(), remove: vi.fn() }));
const revalidatePath = vi.hoisted(() => vi.fn());
const updateTag = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath, updateTag }));
vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn(async () => ({ id: "u", role: "editor" })) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    from: (name: string) => ({
      insert: (values: unknown) => table.insert(name, values),
      update: (values: unknown) => ({ eq: (column: string, value: unknown) => table.update(name, values, column, value) }),
      delete: () => ({ eq: (column: string, value: unknown) => table.remove(name, column, value) }),
    }),
  })),
}));

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
const slot = { day: "2", startsAt: "14:30", endsAt: "15:30", title: "Qi Gong", leader: "Adrien", note: "", family: "bouger" };

beforeEach(() => {
  vi.clearAllMocks();
  table.insert.mockResolvedValue({ error: null });
  table.update.mockResolvedValue({ error: null });
  table.remove.mockResolvedValue({ error: null });
});

test("exports only async server actions", () => {
  for (const [name, value] of Object.entries(planningActions)) expect(value.constructor.name, name).toBe("AsyncFunction");
});

test("adds a new slot and refreshes the public pages", async () => {
  const state = await planningActions.savePlanningSlot({}, form(slot));

  expect(table.insert).toHaveBeenCalledWith("planning_slots", {
    day: 2, starts_at: "14:30", ends_at: "15:30", title: "Qi Gong", leader: "Adrien", note: "", family: "bouger",
  });
  expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  expect(state.success).toBeDefined();
});

test("updates an existing slot by id", async () => {
  await planningActions.savePlanningSlot({}, form({ ...slot, id: "50000000-0000-4000-8000-000000000001" }));

  expect(table.update).toHaveBeenCalledWith("planning_slots", expect.objectContaining({ title: "Qi Gong" }), "id", "50000000-0000-4000-8000-000000000001");
  expect(table.insert).not.toHaveBeenCalled();
});

test("deletes a slot", async () => {
  await planningActions.deletePlanningSlot({}, form({ id: "50000000-0000-4000-8000-000000000001" }));

  expect(table.remove).toHaveBeenCalledWith("planning_slots", "id", "50000000-0000-4000-8000-000000000001");
});

test("saves a day and the settings", async () => {
  await planningActions.savePlanningDay({}, form({ day: "1", opensAt: "13:00", closesAt: "18:00", team: "Mona" }));
  await planningActions.savePlanningSettings({}, form({ effectiveFrom: "2026-09-01", note: "Ouverture à 13 h." }));

  expect(table.update).toHaveBeenCalledWith("planning_days", { opens_at: "13:00", closes_at: "18:00", team: "Mona" }, "day", 1);
  expect(table.update).toHaveBeenCalledWith("planning_settings", expect.objectContaining({ effective_from: "2026-09-01", note: "Ouverture à 13 h." }), "id", 1);
});

test("returns field errors without writing", async () => {
  const state = await planningActions.savePlanningSlot({}, form({ ...slot, endsAt: "13:00" }));

  expect(state.fieldErrors?.endsAt).toBeDefined();
  expect(table.insert).not.toHaveBeenCalled();
});
