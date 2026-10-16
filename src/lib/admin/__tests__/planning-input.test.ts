import { parsePlanningDay, parsePlanningSettings, parsePlanningSlot } from "../planning-input";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const slot = { day: "2", startsAt: "14:30", endsAt: "15:30", title: "Qi Gong", leader: "Adrien", note: "", description: "Gymnastique douce.", family: "bouger" };

test("accepts a complete slot", () => {
  expect(parsePlanningSlot(form(slot))).toEqual({
    success: true,
    data: { id: null, day: 2, startsAt: "14:30", endsAt: "15:30", title: "Qi Gong", leader: "Adrien", note: "", description: "Gymnastique douce.", family: "bouger" },
  });
});

test("refuses a slot that ends before it starts, without a title or with an unknown family", () => {
  const result = parsePlanningSlot(form({ ...slot, endsAt: "14:00", title: " ", family: "autre" }));

  expect(result.success).toBe(false);
  if (!result.success) expect(Object.keys(result.fieldErrors).sort()).toEqual(["endsAt", "family", "title"]);
});

test("accepts a closed day and refuses an opening that ends before it starts", () => {
  expect(parsePlanningDay(form({ day: "6", opensAt: "", closesAt: "", team: "" }))).toEqual({
    success: true,
    data: { day: 6, opensAt: null, closesAt: null, team: "" },
  });
  expect(parsePlanningDay(form({ day: "6", opensAt: "18:00", closesAt: "13:00", team: "" })).success).toBe(false);
});

test("requires a valid effective date", () => {
  expect(parsePlanningSettings(form({ effectiveFrom: "2026-09-01", note: "" })).success).toBe(true);
  expect(parsePlanningSettings(form({ effectiveFrom: "01/09/2026", note: "" })).success).toBe(false);
});
