import type { PlanningFamily } from "@/content/types";

export const dayNames = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;

export const familyLabels: Record<PlanningFamily, string> = {
  creer: "Créer et s'exprimer",
  bouger: "Bouger et prendre l'air",
  echanger: "Échanger et agir ensemble",
};

// "14:00" → "14 h", "14:30" → "14 h 30"
export function formatHour(time: string): string {
  const [hour, minute] = time.split(":");
  return `${Number(hour)} h${minute === "00" ? "" : ` ${minute}`}`;
}

export function formatRange(start: string | null, end: string | null): string {
  return start && end ? `${formatHour(start)} – ${formatHour(end)}` : "";
}

const weekdayFormatter = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "Europe/Paris" });
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// 1 = Monday … 7 = Sunday, in Paris time.
export function parisWeekday(instant: string): number {
  return weekdays.indexOf(weekdayFormatter.format(new Date(instant))) + 1;
}
