import { parsePlanningDay, parsePlanningException, parsePlanningSettings, parsePlanningSlot } from "../planning-input";

function form(values: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    for (const item of [value].flat()) data.append(key, item);
  }
  return data;
}

const slot = { day: "2", startsAt: "14:30", endsAt: "15:30", title: "Qi Gong", leader: "Adrien", note: "", description: "Gymnastique douce.", family: "bouger" };

test("accepts a complete slot", () => {
  expect(parsePlanningSlot(form(slot))).toEqual({
    success: true,
    data: { id: null, day: 2, startsAt: "14:30", endsAt: "15:30", title: "Qi Gong", leader: "Adrien", note: "", description: "Gymnastique douce.", family: "bouger", recurrence: "weekly", monthWeeks: [] },
  });
});

test("reads the weeks of a monthly slot, and ignores them for a weekly one", () => {
  const monthly = parsePlanningSlot(form({ ...slot, recurrence: "only", monthWeeks: ["3", "1", "-1"] }));
  expect(monthly.success && monthly.data).toMatchObject({ recurrence: "only", monthWeeks: [-1, 1, 3] });

  const weekly = parsePlanningSlot(form({ ...slot, recurrence: "weekly", monthWeeks: ["2"] }));
  expect(weekly.success && weekly.data).toMatchObject({ recurrence: "weekly", monthWeeks: [] });

  const missing = parsePlanningSlot(form({ ...slot, recurrence: "except" }));
  expect(missing).toEqual({ success: false, fieldErrors: { monthWeeks: ["Cochez au moins une semaine du mois."] } });
  expect(parsePlanningSlot(form({ ...slot, recurrence: "only", monthWeeks: ["6"] })).success).toBe(false);
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

const today = "2026-10-16";
const slotId = "50000000-0000-4000-8000-000000000001";

test("reads a cancellation, struck or hidden", () => {
  expect(parsePlanningException(form({ kind: "cancel", slotId, date: "2026-10-20", reason: " Adrien absent ", display: "struck" }), today)).toEqual({
    success: true,
    data: { kind: "cancel", slotId, date: "2026-10-20", reason: "Adrien absent", hidden: false },
  });
  const hidden = parsePlanningException(form({ kind: "cancel", slotId, date: "2026-10-16", reason: "", display: "hidden" }), today);
  expect(hidden.success && hidden.data).toMatchObject({ hidden: true, date: "2026-10-16" });
});

test("refuses a past date, a Sunday and a cancellation without its slot", () => {
  expect(parsePlanningException(form({ kind: "cancel", slotId, date: "2026-10-15", reason: "", display: "struck" }), today)).toEqual({
    success: false,
    fieldErrors: { date: ["Choisissez une date à venir."] },
  });
  expect(parsePlanningException(form({ kind: "cancel", slotId, date: "2026-10-18", reason: "", display: "struck" }), today)).toEqual({
    success: false,
    fieldErrors: { date: ["Le GEM est fermé le dimanche : choisissez un autre jour."] },
  });
  const noSlot = parsePlanningException(form({ kind: "cancel", slotId: "", date: "2026-10-20", reason: "", display: "struck" }), today);
  expect(noSlot.success === false && Object.keys(noSlot.fieldErrors)).toEqual(["slotId"]);
});

test("reads a closure of one day or of a period that may start before today", () => {
  const oneDay = parsePlanningException(form({ kind: "closure", date: "2026-11-11", endDate: "", reason: "Armistice" }), today);
  expect(oneDay).toEqual({ success: true, data: { kind: "closure", date: "2026-11-11", endDate: "2026-11-11", reason: "Armistice" } });

  const ongoing = parsePlanningException(form({ kind: "closure", date: "2026-10-12", endDate: "2026-10-20", reason: "Travaux" }), today);
  expect(ongoing.success).toBe(true);
  expect(parsePlanningException(form({ kind: "closure", date: "2026-11-12", endDate: "2026-11-11", reason: "" }), today)).toEqual({
    success: false,
    fieldErrors: { endDate: ["La fin ne peut pas précéder le début."] },
  });
  expect(parsePlanningException(form({ kind: "closure", date: "2026-10-01", endDate: "2026-10-10", reason: "" }), today)).toEqual({
    success: false,
    fieldErrors: { endDate: ["Choisissez une date à venir."] },
  });
});

test("reads an exceptional session like a slot", () => {
  const extra = { kind: "extra", date: "2026-10-21", startsAt: "10:00", endsAt: "12:00", title: "Atelier invité", leader: "Lou", description: "", family: "creer" };

  expect(parsePlanningException(form(extra), today)).toEqual({
    success: true,
    data: { kind: "extra", date: "2026-10-21", startsAt: "10:00", endsAt: "12:00", title: "Atelier invité", leader: "Lou", description: "", family: "creer" },
  });
  const wrong = parsePlanningException(form({ ...extra, endsAt: "09:00", title: "" }), today);
  expect(wrong.success === false && Object.keys(wrong.fieldErrors).sort()).toEqual(["endsAt", "title"]);
  expect(parsePlanningException(form({ ...extra, kind: "autre" }), today).success).toBe(false);
});
