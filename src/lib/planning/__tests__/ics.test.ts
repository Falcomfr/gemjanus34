import type { Planning } from "@/content/types";
import { buildPlanningCalendar } from "../ics";

const planning: Planning = {
  effectiveFrom: "2026-06-22",
  note: "",
  days: [
    { day: 2, opensAt: "13:00", closesAt: "17:00", team: "" },
    { day: 3, opensAt: "13:00", closesAt: "17:00", team: "" },
  ],
  slots: [
    { id: "s1", day: 2, startsAt: "14:00", endsAt: "16:00", title: "Écriture, poésie; atelier", leader: "Anne", note: "", description: "Première ligne\nSeconde ligne, avec une description assez longue pour devoir être pliée en plusieurs lignes.", family: "creer", recurrence: "weekly", monthWeeks: [] },
    { id: "s2", day: 3, startsAt: "14:00", endsAt: "15:00", title: "Yoga doux", leader: "", note: "", description: "", family: "bouger", recurrence: "weekly", monthWeeks: [] },
  ],
  exceptions: [
    { id: "c1", kind: "cancel", date: "2026-11-17", slotId: "s1", hidden: false, reason: "Animatrice absente" },
    { id: "f1", kind: "closure", date: "2026-11-25", endDate: "2026-11-25", reason: "Fermeture" },
    { id: "x1", kind: "extra", date: "2026-11-18", startsAt: "10:00", endsAt: "12:00", title: "Sortie au musée", leader: "", description: "", family: "echanger" },
  ],
};
const now = "2026-11-09T10:00:00Z";
const calendar = buildPlanningCalendar(planning, now);
const lines = calendar.split("\r\n");

test("is a named iCalendar with the Paris time zone", () => {
  expect(calendar.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
  expect(calendar.endsWith("END:VCALENDAR\r\n")).toBe(true);
  expect(lines).toContain("X-WR-CALNAME:Planning Janus34");
  expect(lines).toContain("BEGIN:VTIMEZONE");
  expect(lines).toContain("TZID:Europe/Paris");
});

test("dates each session in Paris time with a stable identifier", () => {
  expect(lines).toContain("UID:2026-11-10-s1@gemjanus34.fr");
  expect(lines).toContain("DTSTART;TZID=Europe/Paris:20261110T140000");
  expect(lines).toContain("DTEND;TZID=Europe/Paris:20261110T160000");
  expect(lines).toContain("DTSTAMP:20261109T100000Z");
  expect(lines).toContain("SUMMARY:Écriture\\, poésie\\; atelier");
  expect(lines).toContain("LOCATION:405 rue des Grèzes\\, 34070 Montpellier");
  expect(calendar.replace(/\r\n /g, "")).toContain("DESCRIPTION:Première ligne\\nSeconde ligne\\, avec");
});

test("leaves out cancelled sessions and closed days, keeps extra sessions", () => {
  expect(calendar).not.toContain("UID:2026-11-17-s1@");
  expect(calendar).not.toContain("UID:2026-11-25-s2@");
  expect(lines).toContain("UID:2026-11-18-x1@gemjanus34.fr");
  expect(lines).toContain("DTSTART;TZID=Europe/Paris:20261118T100000");
});

test("covers the coming eight weeks", () => {
  // s1 and s2 every week, minus one cancellation and one closure, plus one extra session.
  expect(lines.filter((line) => line === "BEGIN:VEVENT")).toHaveLength(8 + 8 - 2 + 1);
  expect(calendar).toContain("UID:2026-12-30-s2@");
  expect(calendar).not.toContain("UID:2027-01-05-s1@");
});

test("folds long lines at 75 bytes", () => {
  expect(calendar).toContain("\r\n ");
  for (const line of lines) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
});

test("an empty planning is still a valid calendar", () => {
  const empty = buildPlanningCalendar({ ...planning, slots: [], exceptions: [] }, now);
  expect(empty).toContain("BEGIN:VCALENDAR");
  expect(empty).not.toContain("BEGIN:VEVENT");
});
