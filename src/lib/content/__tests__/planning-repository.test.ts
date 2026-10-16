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
  });
});

test("reads the planning from Supabase, sorted by day then time", async () => {
  const client = {
    getPlanning: vi.fn().mockResolvedValue({
      settings: { data: [{ effective_from: "2026-09-01", note: "Ouverture à 13 h." }], error: null },
      days: { data: [{ day: 2, opens_at: "13:00:00", closes_at: "18:00:00", team: "Mona" }, { day: 1, opens_at: null, closes_at: null, team: "" }], error: null },
      slots: {
        data: [
          { id: "b", day: 2, starts_at: "16:00:00", ends_at: "17:00:00", title: "Tard", leader: "", note: "", description: "Fin de journée.", family: "echanger" },
          { id: "a", day: 2, starts_at: "14:00:00", ends_at: "15:00:00", title: "Tôt", leader: "Elif", note: "", description: "", family: "creer" },
          { id: "c", day: 1, starts_at: "14:00:00", ends_at: "15:00:00", title: "Lundi", leader: "", note: "", description: "", family: "bouger" },
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
      { id: "c", day: 1, startsAt: "14:00", endsAt: "15:00", title: "Lundi", leader: "", note: "", description: "", family: "bouger" },
      { id: "a", day: 2, startsAt: "14:00", endsAt: "15:00", title: "Tôt", leader: "Elif", note: "", description: "", family: "creer" },
      { id: "b", day: 2, startsAt: "16:00", endsAt: "17:00", title: "Tard", leader: "", note: "", description: "Fin de journée.", family: "echanger" },
    ],
  });
});
