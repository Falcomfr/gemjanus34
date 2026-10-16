import type { Planning, PlanningDay, PlanningException, PlanningSlot } from "@/content/types";

// Dates are "YYYY-MM-DD" calendar days, computed in UTC so no clock change can shift them.

export type PlanningWeekSlot = Omit<PlanningSlot, "day"> & {
  day: number;
  date: string;
  status: "normal" | "cancelled" | "extra";
  reason: string;
};

export type PlanningWeekDay = PlanningDay & {
  date: string;
  closedReason: string | null;
  slots: PlanningWeekSlot[];
};

export type PlanningWeek = { monday: string; days: PlanningWeekDay[] };

const parisDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });

export function parisDate(instant: string): string {
  return parisDay.format(new Date(instant));
}

const toUtc = (date: string) => new Date(`${date}T00:00:00Z`);

export function addDays(date: string, days: number): string {
  const next = toUtc(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

// 1 = Monday … 7 = Sunday.
export function isoWeekday(date: string): number {
  return toUtc(date).getUTCDay() || 7;
}

/** Monday of the week shown today; on Sunday, the coming week. */
export function currentMonday(now: string): string {
  const today = parisDate(now);
  const weekday = isoWeekday(today);
  return weekday === 7 ? addDays(today, 1) : addDays(today, 1 - weekday);
}

export function occursOn(slot: Pick<PlanningSlot, "recurrence" | "monthWeeks">, date: string): boolean {
  if (slot.recurrence === "weekly") return true;
  const dayOfMonth = Number(date.slice(8));
  const isLast = addDays(date, 7).slice(0, 7) !== date.slice(0, 7);
  const matches = slot.monthWeeks.includes(Math.ceil(dayOfMonth / 7)) || (isLast && slot.monthWeeks.includes(-1));
  return slot.recurrence === "only" ? matches : !matches;
}

export function buildWeek(planning: Planning, monday: string): PlanningWeek {
  const days = planning.days.map((day): PlanningWeekDay => {
    const date = addDays(monday, day.day - 1);
    const closure = planning.exceptions.find(
      (exception): exception is Extract<PlanningException, { kind: "closure" }> =>
        exception.kind === "closure" && exception.date <= date && date <= exception.endDate,
    );
    if (closure) return { ...day, date, closedReason: closure.reason, slots: [] };

    const template = planning.slots
      .filter((slot) => slot.day === day.day && occursOn(slot, date))
      .map((slot): PlanningWeekSlot => ({ ...slot, date, status: "normal", reason: "" }));
    const extras = planning.exceptions.flatMap((exception): PlanningWeekSlot[] =>
      exception.kind === "extra" && exception.date === date
        ? [{ ...exception, day: day.day, date, note: "", recurrence: "weekly", monthWeeks: [], status: "extra", reason: "" }]
        : [],
    );
    const slots = [...template, ...extras].flatMap((slot): PlanningWeekSlot[] => {
      const cancel = planning.exceptions.find(
        (exception): exception is Extract<PlanningException, { kind: "cancel" }> =>
          exception.kind === "cancel" && exception.slotId === slot.id && exception.date === date,
      );
      if (!cancel) return [slot];
      return cancel.hidden ? [] : [{ ...slot, status: "cancelled", reason: cancel.reason }];
    });
    return { ...day, date, closedReason: null, slots: slots.toSorted((left, right) => left.startsAt.localeCompare(right.startsAt)) };
  });
  return { monday, days };
}

/** The first open day from today on, and the reason when the GEM is closed today. */
export function nextOpenDay(planning: Planning, now: string): { day: PlanningWeekDay; closedToday: string | null } | null {
  const today = parisDate(now);
  const monday = currentMonday(now);
  const days = [...buildWeek(planning, monday).days, ...buildWeek(planning, addDays(monday, 7)).days];
  const day = days.find((candidate) => candidate.date >= today && candidate.opensAt && !candidate.closedReason);
  if (!day) return null;
  const closedToday = days.find((candidate) => candidate.date === today)?.closedReason ?? null;
  return { day, closedToday };
}

const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const dayNumber = (date: string) => (Number(date.slice(8)) === 1 ? "1er" : String(Number(date.slice(8))));
const monthName = (date: string) => months[Number(date.slice(5, 7)) - 1];

export function dayDateLabel(date: string): string {
  return `${dayNumber(date)} ${monthName(date)}`;
}

export function weekRangeLabel(monday: string): string {
  const saturday = addDays(monday, 5);
  const end = `${dayDateLabel(saturday)} ${saturday.slice(0, 4)}`;
  if (monday.slice(0, 4) !== saturday.slice(0, 4)) return `Semaine du ${dayDateLabel(monday)} ${monday.slice(0, 4)} au ${end}`;
  if (monday.slice(5, 7) !== saturday.slice(5, 7)) return `Semaine du ${dayDateLabel(monday)} au ${end}`;
  return `Semaine du ${dayNumber(monday)} au ${end}`;
}

const weekdayNames = ["", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const ordinal = (week: number) => (week === -1 ? "dernier" : week === 1 ? "1er" : `${week}e`);

function list(items: string[], separator = " et "): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")}${separator}${items.at(-1)}`;
}

/** "Le dernier jeudi du mois", "Tous les jeudis sauf le dernier du mois"; empty when weekly. */
export function recurrenceLabel(slot: Pick<PlanningSlot, "day" | "recurrence" | "monthWeeks">): string {
  if (slot.recurrence === "weekly") return "";
  // The last week reads last: "les 2e et dernier".
  const weeks = slot.monthWeeks.toSorted((left, right) => (left === -1 ? 1 : right === -1 ? -1 : left - right)).map(ordinal);
  const day = weekdayNames[slot.day];
  if (slot.recurrence === "except") return `Tous les ${day}s sauf ${list(weeks.map((week) => `le ${week}`))} du mois`;
  return weeks.length === 1 ? `Le ${weeks[0]} ${day} du mois` : `Les ${list(weeks)} ${day}s du mois`;
}

const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toUtc(value).getTime()) && toUtc(value).toISOString().startsWith(value);

/** The Monday asked for (`?semaine=`), kept between the current week and eight weeks ahead. */
export function resolveWeek(requested: string | undefined, now: string): { monday: string; previous?: string; next?: string } {
  const current = currentMonday(now);
  const last = addDays(current, 56);
  const monday =
    requested && isDate(requested) && isoWeekday(requested) === 1 && requested >= current && requested <= last ? requested : current;
  return {
    monday,
    ...(monday > current ? { previous: addDays(monday, -7) } : {}),
    ...(monday < last ? { next: addDays(monday, 7) } : {}),
  };
}
