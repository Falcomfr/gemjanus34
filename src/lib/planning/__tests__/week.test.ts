import { bundledPlanning } from "@/content/planning";
import type { Planning, PlanningException } from "@/content/types";
import {
  addDays,
  buildWeek,
  currentMonday,
  dayDateLabel,
  nextOpenDay,
  occursOn,
  parisDate,
  recurrenceLabel,
  resolveWeek,
  weekRangeLabel,
} from "../week";

const soupe = bundledPlanning.slots.find((slot) => slot.title === "Soupe au caillou")!;
const horsLesMurs = bundledPlanning.slots.find((slot) => slot.title === "GEM « Hors les murs »")!;
const collage = bundledPlanning.slots.find((slot) => slot.title === "Collage")!;
const qiGong = bundledPlanning.slots.find((slot) => slot.title === "Qi Gong")!;

function withExceptions(...exceptions: PlanningException[]): Planning {
  return { ...bundledPlanning, exceptions };
}

const titles = (planning: Planning, monday: string, day: number) =>
  buildWeek(planning, monday).days.find((candidate) => candidate.day === day)!.slots.map((slot) => slot.title);

test("reads the calendar day in Paris, across midnight and the October clock change", () => {
  expect(parisDate("2026-10-15T22:30:00Z")).toBe("2026-10-16");
  expect(parisDate("2026-10-25T00:30:00Z")).toBe("2026-10-25");
  expect(addDays("2026-10-24", 1)).toBe("2026-10-25");
  expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
  expect(addDays("2026-12-28", 7)).toBe("2027-01-04");
});

test("the current week starts on Monday, and on Sunday it is the coming one", () => {
  expect(currentMonday("2026-10-16T10:00:00Z")).toBe("2026-10-12");
  expect(currentMonday("2026-10-12T10:00:00Z")).toBe("2026-10-12");
  expect(currentMonday("2026-10-18T10:00:00Z")).toBe("2026-10-19");
});

test("places monthly sessions on the right weeks, in months of four or five Thursdays", () => {
  // October 2026 has five Thursdays: the 22nd is the fourth, the 29th the last.
  expect(occursOn(soupe, "2026-10-22")).toBe(false);
  expect(occursOn(soupe, "2026-10-29")).toBe(true);
  expect(occursOn(horsLesMurs, "2026-10-22")).toBe(true);
  expect(occursOn(horsLesMurs, "2026-10-29")).toBe(false);
  // November 2026 has four Thursdays: the 26th is both the fourth and the last.
  expect(occursOn(soupe, "2026-11-26")).toBe(true);
  expect(occursOn(horsLesMurs, "2026-11-26")).toBe(false);
  expect(occursOn(collage, "2026-11-07")).toBe(true);
  expect(occursOn(collage, "2026-11-14")).toBe(false);
  expect(occursOn(qiGong, "2026-11-10")).toBe(true);
});

test("builds a dated week from the template", () => {
  const week = buildWeek(bundledPlanning, "2026-10-26");

  expect(week.days.map((day) => day.date)).toEqual(["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31"]);
  expect(titles(bundledPlanning, "2026-10-26", 4)).toEqual(["Soupe au caillou", "Yoga en douceur", "Écriture poétique"]);
  expect(titles(bundledPlanning, "2026-10-19", 4)).toEqual(["GEM « Hors les murs »", "Yoga en douceur", "Écriture poétique"]);
  expect(week.days[3].slots[0]).toMatchObject({ date: "2026-10-29", status: "normal", reason: "" });
});

test("strikes or hides a cancelled session, only on its date", () => {
  const planning = withExceptions(
    { id: "c1", kind: "cancel", date: "2026-10-20", slotId: qiGong.id, hidden: false, reason: "Adrien absent" },
    { id: "c2", kind: "cancel", date: "2026-10-22", slotId: "jeudi-yoga", hidden: true, reason: "" },
  );

  const week = buildWeek(planning, "2026-10-19");
  expect(week.days[1].slots.find((slot) => slot.title === "Qi Gong")).toMatchObject({ status: "cancelled", reason: "Adrien absent" });
  expect(titles(planning, "2026-10-19", 4)).not.toContain("Yoga en douceur");
  expect(buildWeek(planning, "2026-10-26").days[1].slots.find((slot) => slot.title === "Qi Gong")?.status).toBe("normal");
});

test("adds an exceptional session in time order", () => {
  const planning = withExceptions({
    id: "e1", kind: "extra", date: "2026-10-21", startsAt: "10:00", endsAt: "12:00", title: "Atelier invité", leader: "Lou", description: "", family: "creer",
  });

  const wednesday = buildWeek(planning, "2026-10-19").days[2];
  expect(wednesday.slots.map((slot) => slot.title)).toEqual(["Atelier invité", "Les mots qui volent"]);
  expect(wednesday.slots[0]).toMatchObject({ id: "e1", status: "extra", leader: "Lou", date: "2026-10-21" });
});

test("a closure over several days, across two weeks, closes each day and drops its sessions", () => {
  const planning = withExceptions({ id: "f1", kind: "closure", date: "2026-12-24", endDate: "2027-01-02", reason: "Fêtes de fin d'année" });

  const before = buildWeek(planning, "2026-12-21");
  expect(before.days.map((day) => day.closedReason)).toEqual([null, null, null, "Fêtes de fin d'année", "Fêtes de fin d'année", "Fêtes de fin d'année"]);
  expect(before.days[3].slots).toEqual([]);
  expect(buildWeek(planning, "2026-12-28").days.every((day) => day.closedReason === "Fêtes de fin d'année")).toBe(true);
  expect(buildWeek(planning, "2027-01-04").days[0].closedReason).toBeNull();
});

test("finds the next opening day, and says when the GEM is closed today", () => {
  expect(nextOpenDay(bundledPlanning, "2026-10-15T08:00:00Z")).toMatchObject({ day: { day: 4, date: "2026-10-15" }, closedToday: null });
  expect(nextOpenDay(bundledPlanning, "2026-10-18T10:00:00Z")).toMatchObject({ day: { day: 1, date: "2026-10-19" }, closedToday: null });

  const closed = withExceptions({ id: "f1", kind: "closure", date: "2026-11-11", endDate: "2026-11-11", reason: "Armistice" });
  expect(nextOpenDay(closed, "2026-11-11T09:00:00Z")).toMatchObject({ day: { day: 4, date: "2026-11-12" }, closedToday: "Armistice" });

  const saturdayClosed = withExceptions({ id: "f2", kind: "closure", date: "2026-10-17", endDate: "2026-10-17", reason: "Travaux" });
  expect(nextOpenDay(saturdayClosed, "2026-10-17T09:00:00Z")).toMatchObject({ day: { date: "2026-10-19" }, closedToday: "Travaux" });
});

test("names the week, the day and the recurrence in French", () => {
  expect(weekRangeLabel("2026-10-19")).toBe("Semaine du 19 au 24 octobre 2026");
  expect(weekRangeLabel("2026-09-28")).toBe("Semaine du 28 septembre au 3 octobre 2026");
  expect(weekRangeLabel("2026-12-28")).toBe("Semaine du 28 décembre 2026 au 2 janvier 2027");
  expect(weekRangeLabel("2026-06-01")).toBe("Semaine du 1er au 6 juin 2026");
  expect(dayDateLabel("2026-10-01")).toBe("1er octobre");
  expect(recurrenceLabel(soupe)).toBe("Le dernier jeudi du mois");
  expect(recurrenceLabel(collage)).toBe("Le 1er samedi du mois");
  expect(recurrenceLabel(horsLesMurs)).toBe("Tous les jeudis sauf le dernier du mois");
  expect(recurrenceLabel({ ...collage, monthWeeks: [1, 3] })).toBe("Les 1er et 3e samedis du mois");
  expect(recurrenceLabel({ ...horsLesMurs, monthWeeks: [2, -1] })).toBe("Tous les jeudis sauf le 2e et le dernier du mois");
  expect(recurrenceLabel(qiGong)).toBe("");
});

test("resolves the requested week within the next eight weeks", () => {
  const now = "2026-10-16T10:00:00Z";

  expect(resolveWeek(undefined, now)).toEqual({ monday: "2026-10-12", next: "2026-10-19" });
  expect(resolveWeek("2026-10-19", now)).toEqual({ monday: "2026-10-19", previous: "2026-10-12", next: "2026-10-26" });
  expect(resolveWeek("2026-12-07", now)).toEqual({ monday: "2026-12-07", previous: "2026-11-30" });
  for (const invalid of ["2026-12-14", "2026-10-05", "2026-10-20", "2026-02-30", "demain", ""]) {
    expect(resolveWeek(invalid, now).monday, invalid).toBe("2026-10-12");
  }
});

test("looks past a long closure for the next opening day", () => {
  const summer = withExceptions({ id: "f1", kind: "closure", date: "2026-08-03", endDate: "2026-08-22", reason: "Congés d'été" });
  expect(nextOpenDay(summer, "2026-08-04T09:00:00Z")).toMatchObject({ day: { date: "2026-08-24" }, closedToday: "Congés d'été" });

  const endless = withExceptions({ id: "f2", kind: "closure", date: "2026-08-03", endDate: "2027-08-03", reason: "Travaux" });
  expect(nextOpenDay(endless, "2026-08-04T09:00:00Z")).toEqual({ day: null, closedToday: "Travaux" });
});
