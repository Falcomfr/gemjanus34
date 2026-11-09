import { bundledPlanning } from "@/content/planning";
import type { Planning } from "@/content/types";
import { buildWeek } from "@/lib/planning/week";
import { weekChanges } from "../week-changes";

const slot = bundledPlanning.slots.find((candidate) => candidate.day === 2 && candidate.recurrence === "weekly")!;
const planning: Planning = {
  ...bundledPlanning,
  exceptions: [
    { id: "c1", kind: "cancel", date: "2026-11-10", slotId: slot.id, hidden: false, reason: "Animatrice absente" },
    { id: "f1", kind: "closure", date: "2026-11-11", endDate: "2026-11-11", reason: "Armistice" },
    { id: "x1", kind: "extra", date: "2026-11-13", startsAt: "10:00", endsAt: "12:00", title: "Sortie au musée", leader: "", description: "", family: "echanger" },
  ],
};

test("lists the closed days, the cancelled sessions and the extra ones of the week", () => {
  const changes = weekChanges(buildWeek(planning, "2026-11-09"));

  expect(changes.closures).toEqual([{ date: "2026-11-11", reason: "Armistice" }]);
  expect(changes.cancelled.map((session) => [session.id, session.reason])).toEqual([[slot.id, "Animatrice absente"]]);
  expect(changes.extras.map((session) => session.title)).toEqual(["Sortie au musée"]);
});

test("a week without exceptions has no change", () => {
  expect(weekChanges(buildWeek({ ...planning, exceptions: [] }, "2026-11-09"))).toEqual({ closures: [], cancelled: [], extras: [] });
});
