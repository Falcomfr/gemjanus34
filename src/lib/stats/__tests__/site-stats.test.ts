import { expect, test } from "vitest";
import {
  conferenceFill,
  eventTotals,
  galleryBreakdown,
  lastMonths,
  messageStats,
  planningByMonth,
  staleContent,
  teamActivity,
} from "../site-stats";

const now = new Date("2026-11-15T12:00:00Z");

test("lists the last twelve months, oldest first", () => {
  const months = lastMonths(now);
  expect(months).toHaveLength(12);
  expect(months[0]).toBe("2025-12");
  expect(months.at(-1)).toBe("2026-11");
});

test("counts messages and callbacks per month, what waits and how fast the team answers", () => {
  const stats = messageStats(
    [
      { kind: "message", created_at: "2026-11-02T10:00:00Z", handled_at: "2026-11-03T10:00:00Z" },
      { kind: "callback", created_at: "2026-11-10T10:00:00Z", handled_at: "2026-11-10T16:00:00Z" },
      { kind: "message", created_at: "2026-10-31T23:30:00Z", handled_at: null },
      { kind: "message", created_at: "2024-01-01T10:00:00Z", handled_at: null },
    ],
    now,
  );

  // 31 Oct 23:30 UTC is already 1 November in Paris.
  expect(stats.byMonth.at(-1)).toEqual({ month: "2026-11", messages: 2, callbacks: 1 });
  expect(stats.pending).toBe(2);
  expect(stats.averageHours).toBe(15);
});

test("adds up each gesture over 30 days and 12 months", () => {
  const totals = eventTotals(
    [
      { day: "2026-11-14", event: "phone", count: 3 },
      { day: "2026-09-01", event: "phone", count: 2 },
      { day: "2025-01-01", event: "phone", count: 9 },
      { day: "2026-11-01", event: "pdf", count: 1 },
    ],
    now,
  );

  expect(totals.find((row) => row.event === "phone")).toMatchObject({ last30: 3, last365: 5 });
  expect(totals.find((row) => row.event === "map")).toMatchObject({ last30: 0, last365: 0 });
  expect(totals.map((row) => row.event)).toEqual(["phone", "map", "pdf", "helloasso"]);
});

test("fills each conference with its taken seats, newest first", () => {
  const rows = conferenceFill(
    [
      { id: "a", title: "Sommeil", starts_at: "2026-10-01T18:00:00Z", capacity: 40 },
      { id: "b", title: "Bipolarité", starts_at: "2026-12-01T18:00:00Z", capacity: 30 },
    ],
    [{ conference_id: "a", seats: 30 }],
  );

  expect(rows).toEqual([
    { title: "Bipolarité", startsAt: "2026-12-01T18:00:00Z", taken: 0, capacity: 30, rate: 0 },
    { title: "Sommeil", startsAt: "2026-10-01T18:00:00Z", taken: 30, capacity: 40, rate: 75 },
  ]);
});

test("counts cancelled, extra sessions and closures per month", () => {
  const months = planningByMonth(
    [
      { kind: "cancel", date: "2026-11-03" },
      { kind: "cancel", date: "2026-11-05" },
      { kind: "closure", date: "2026-11-11" },
      { kind: "extra", date: "2026-10-20" },
    ],
    now,
  );

  expect(months.at(-1)).toEqual({ month: "2026-11", cancel: 2, extra: 0, closure: 1 });
  expect(months.at(-2)).toEqual({ month: "2026-10", cancel: 0, extra: 1, closure: 0 });
});

test("puts the oldest published pages first and flags those over six months", () => {
  const rows = staleContent(
    [
      { title: "Contact", slug: "contact", updated_at: "2026-11-01T00:00:00Z" },
      { title: "Ressources", slug: "ressources", updated_at: "2026-03-01T00:00:00Z" },
    ],
    now,
  );

  expect(rows.map((row) => [row.title, row.stale])).toEqual([["Ressources", true], ["Contact", false]]);
});

test("sums what each person published or changed over 90 days", () => {
  const rows = teamActivity(
    [
      { actor_id: "u1", action: "page.publish", created_at: "2026-11-10T00:00:00Z" },
      { actor_id: "u1", action: "news.publish", created_at: "2026-11-11T00:00:00Z" },
      { actor_id: "u2", action: "page.update_published", created_at: "2026-11-12T00:00:00Z" },
      { actor_id: "u2", action: "page.publish", created_at: "2026-01-01T00:00:00Z" },
    ],
    new Map([["u1", "Mona"], ["u2", "Elif"]]),
    now,
  );

  expect(rows).toEqual([
    { name: "Mona", pages: 1, news: 1, total: 2 },
    { name: "Elif", pages: 1, news: 0, total: 1 },
  ]);
});

test("counts the gallery by workshop and by kind", () => {
  const breakdown = galleryBreakdown([
    { kind: "image", workshop: "Linogravure" },
    { kind: "text", workshop: "Écriture" },
    { kind: "pdf", workshop: "Écriture" },
    { kind: "image", workshop: null },
  ]);

  expect(breakdown.byWorkshop).toEqual([
    { label: "Écriture", count: 2 },
    { label: "Linogravure", count: 1 },
    { label: "Sans atelier", count: 1 },
  ]);
  expect(breakdown.byKind).toEqual({ image: 2, text: 1, pdf: 1 });
});

test("leaves the fill rate empty for a conference without a limit", () => {
  const [row] = conferenceFill([{ id: "a", title: "Ouverte", starts_at: "2026-12-01T18:00:00Z", capacity: null }], [{ conference_id: "a", seats: 12 }]);
  expect(row).toMatchObject({ taken: 12, capacity: null, rate: null });
});
