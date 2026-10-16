import { expect, test, vi } from "vitest";
import { publicContentRepository as localRepository } from "../local-public-content-repository";
import { createSupabasePublicContentRepository, type PublicContentQueryClient } from "../supabase-public-content-repository";

test("ships the current planning when Supabase is not configured", async () => {
  const planning = await localRepository.getPlanning();

  expect(planning?.effectiveFrom).toBe("2026-06-22");
  expect(planning?.days).toHaveLength(6);
  expect(planning?.slots).toHaveLength(11);
  expect(planning?.slots.find((slot) => slot.title === "Qi Gong")).toMatchObject({
    day: 2,
    startsAt: "14:30",
    endsAt: "15:30",
    leader: "Adrien",
    family: "bouger",
    recurrence: "weekly",
    monthWeeks: [],
  });
  expect(planning?.slots.find((slot) => slot.title === "Soupe au caillou")).toMatchObject({ recurrence: "only", monthWeeks: [-1] });
  expect(planning?.exceptions).toEqual([]);
});

test("reads the planning from Supabase, sorted by day then time", async () => {
  const client = {
    getPlanning: vi.fn().mockResolvedValue({
      settings: { data: [{ effective_from: "2026-09-01", note: "Ouverture à 13 h." }], error: null },
      days: { data: [{ day: 2, opens_at: "13:00:00", closes_at: "18:00:00", team: "Mona" }, { day: 1, opens_at: null, closes_at: null, team: "" }], error: null },
      slots: {
        data: [
          { id: "b", day: 2, starts_at: "16:00:00", ends_at: "17:00:00", title: "Tard", leader: "", note: "", description: "Fin de journée.", family: "echanger", recurrence: "only", month_weeks: [-1] },
          { id: "a", day: 2, starts_at: "14:00:00", ends_at: "15:00:00", title: "Tôt", leader: "Elif", note: "", description: "", family: "creer", recurrence: "weekly", month_weeks: [] },
          { id: "c", day: 1, starts_at: "14:00:00", ends_at: "15:00:00", title: "Lundi", leader: "", note: "", description: "", family: "bouger", recurrence: "except", month_weeks: [1, 3] },
        ],
        error: null,
      },
      exceptions: {
        data: [
          { id: "x3", kind: "extra", date: "2026-10-21", end_date: null, slot_id: null, hidden: false, reason: "", starts_at: "10:00:00", ends_at: "12:00:00", title: "Atelier invité", leader: "Lou", description: "Une fois.", family: "creer" },
          { id: "x1", kind: "cancel", date: "2026-10-20", end_date: null, slot_id: "a", hidden: true, reason: "Elif absente", starts_at: null, ends_at: null, title: null, leader: "", description: "", family: null },
          { id: "x2", kind: "closure", date: "2026-11-11", end_date: "2026-11-11", slot_id: null, hidden: false, reason: "Armistice", starts_at: null, ends_at: null, title: null, leader: "", description: "", family: null },
        ],
        error: null,
      },
    }),
  } as unknown as PublicContentQueryClient;

  const planning = await createSupabasePublicContentRepository(client).getPlanning();

  expect(planning).toEqual({
    effectiveFrom: "2026-09-01",
    note: "Ouverture à 13 h.",
    days: [
      { day: 1, opensAt: null, closesAt: null, team: "" },
      { day: 2, opensAt: "13:00", closesAt: "18:00", team: "Mona" },
    ],
    slots: [
      { id: "c", day: 1, startsAt: "14:00", endsAt: "15:00", title: "Lundi", leader: "", note: "", description: "", family: "bouger", recurrence: "except", monthWeeks: [1, 3] },
      { id: "a", day: 2, startsAt: "14:00", endsAt: "15:00", title: "Tôt", leader: "Elif", note: "", description: "", family: "creer", recurrence: "weekly", monthWeeks: [] },
      { id: "b", day: 2, startsAt: "16:00", endsAt: "17:00", title: "Tard", leader: "", note: "", description: "Fin de journée.", family: "echanger", recurrence: "only", monthWeeks: [-1] },
    ],
    exceptions: [
      { id: "x1", kind: "cancel", date: "2026-10-20", slotId: "a", hidden: true, reason: "Elif absente" },
      { id: "x3", kind: "extra", date: "2026-10-21", startsAt: "10:00", endsAt: "12:00", title: "Atelier invité", leader: "Lou", description: "Une fois.", family: "creer" },
      { id: "x2", kind: "closure", date: "2026-11-11", endDate: "2026-11-11", reason: "Armistice" },
    ],
  });
});
