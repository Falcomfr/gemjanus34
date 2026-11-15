import { siteEvents, type SiteEvent } from "./site-events";

const DAY_MS = 24 * 60 * 60 * 1000;
const parisDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });

/** YYYY-MM-DD of an instant, in Paris time: the association's months and days. */
function dayOf(value: string | Date): string {
  return parisDay.format(typeof value === "string" ? new Date(value) : value);
}

/** The last twelve months as YYYY-MM, oldest first. */
export function lastMonths(now: Date): string[] {
  const [year, month] = dayOf(now).split("-").map(Number) as [number, number];
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (11 - index), 1));
    return date.toISOString().slice(0, 7);
  });
}

type MessageRow = { kind: string; created_at: string; handled_at: string | null };

export function messageStats(rows: MessageRow[], now: Date) {
  const byMonth = lastMonths(now).map((month) => {
    const inMonth = rows.filter((row) => dayOf(row.created_at).startsWith(month));
    const callbacks = inMonth.filter((row) => row.kind === "callback").length;
    return { month, messages: inMonth.length - callbacks, callbacks };
  });
  const delays = rows
    .filter((row) => row.handled_at)
    .map((row) => (new Date(row.handled_at!).getTime() - new Date(row.created_at).getTime()) / 3_600_000);
  return {
    byMonth,
    pending: rows.filter((row) => !row.handled_at).length,
    averageHours: delays.length ? Math.round(delays.reduce((sum, hours) => sum + hours, 0) / delays.length) : null,
  };
}

type EventRow = { day: string; event: string; count: number };

export function eventTotals(rows: EventRow[], now: Date): Array<{ event: SiteEvent; last30: number; last365: number }> {
  const since = (days: number) => dayOf(new Date(now.getTime() - (days - 1) * DAY_MS));
  const from30 = since(30);
  const from365 = since(365);
  return siteEvents.map((event) => {
    const mine = rows.filter((row) => row.event === event);
    const sum = (from: string) => mine.filter((row) => row.day >= from).reduce((total, row) => total + row.count, 0);
    return { event, last30: sum(from30), last365: sum(from365) };
  });
}

type Conference = { id: string; title: string; starts_at: string; capacity: number | null };

export function conferenceFill(conferences: Conference[], taken: Array<{ conference_id: string; seats: number }>) {
  return [...conferences]
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
    .map((conference) => {
      const seats = taken.find((row) => row.conference_id === conference.id)?.seats ?? 0;
      return {
        title: conference.title,
        startsAt: conference.starts_at,
        taken: seats,
        capacity: conference.capacity,
        rate: conference.capacity ? Math.round((seats / conference.capacity) * 100) : null,
      };
    });
}

export function planningByMonth(rows: Array<{ kind: string; date: string }>, now: Date) {
  return lastMonths(now).map((month) => {
    const inMonth = rows.filter((row) => row.date.startsWith(month));
    const count = (kind: string) => inMonth.filter((row) => row.kind === kind).length;
    return { month, cancel: count("cancel"), extra: count("extra"), closure: count("closure") };
  });
}

const STALE_DAYS = 183;

export function staleContent(pages: Array<{ title: string; slug: string; updated_at: string }>, now: Date) {
  return [...pages]
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
    .map((page) => ({
      title: page.title,
      slug: page.slug,
      updatedAt: page.updated_at,
      stale: now.getTime() - new Date(page.updated_at).getTime() > STALE_DAYS * DAY_MS,
    }));
}

const ACTIVITY_DAYS = 90;

export function teamActivity(rows: Array<{ actor_id: string | null; action: string; created_at: string }>, names: Map<string, string>, now: Date) {
  const since = now.getTime() - ACTIVITY_DAYS * DAY_MS;
  const people = new Map<string, { name: string; pages: number; news: number; total: number }>();
  for (const row of rows) {
    if (new Date(row.created_at).getTime() < since) continue;
    const name = (row.actor_id && names.get(row.actor_id)) || "Compte supprimé";
    const person = people.get(name) ?? { name, pages: 0, news: 0, total: 0 };
    if (row.action.startsWith("page.")) person.pages++;
    if (row.action.startsWith("news.")) person.news++;
    person.total++;
    people.set(name, person);
  }
  return [...people.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "fr"));
}

export function galleryBreakdown(items: Array<{ kind: string; workshop: string | null }>) {
  const workshops = new Map<string, number>();
  for (const item of items) {
    const label = item.workshop || "Sans atelier";
    workshops.set(label, (workshops.get(label) ?? 0) + 1);
  }
  const count = (kind: string) => items.filter((item) => item.kind === kind).length;
  return {
    byWorkshop: [...workshops].map(([label, total]) => ({ label, count: total })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr")),
    byKind: { image: count("image"), text: count("text"), pdf: count("pdf") },
  };
}

export { ACTIVITY_DAYS, STALE_DAYS };
