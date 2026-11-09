import { contact } from "@/content/contact";
import type { Planning } from "@/content/types";
import { addDays, buildWeek, currentMonday } from "./week";

// Paris rules since 1996: summer time from the last Sunday of March to the last Sunday of October.
const parisTimeZone = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Paris",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

const escapeText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");

const localTime = (date: string, time: string) => `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;

// RFC 5545: lines of at most 75 octets, continued on lines starting with one space, never inside a character.
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const character of line) {
    const width = encoder.encode(character).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (size + width > limit) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += character;
    size += width;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/** The sessions of the coming weeks (cancelled sessions and closed days left out) as an iCalendar feed. */
export function buildPlanningCalendar(planning: Planning, now: string, weeks = 8): string {
  const stamp = `${now.slice(0, 19).replace(/[-:]/g, "")}Z`;
  const monday = currentMonday(now);
  const events = Array.from({ length: weeks }, (_, week) => buildWeek(planning, addDays(monday, 7 * week)).days)
    .flat()
    .flatMap((day) => day.slots.filter((slot) => slot.status !== "cancelled"))
    .flatMap((slot) => [
      "BEGIN:VEVENT",
      `UID:${slot.date}-${slot.id}@gemjanus34.fr`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Paris:${localTime(slot.date, slot.startsAt)}`,
      `DTEND;TZID=Europe/Paris:${localTime(slot.date, slot.endsAt)}`,
      `SUMMARY:${escapeText(slot.title)}`,
      `LOCATION:${escapeText(`${contact.street}, ${contact.city}`)}`,
      ...(slot.description ? [`DESCRIPTION:${escapeText(slot.description)}`] : []),
      "END:VEVENT",
    ]);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Janus34//Planning//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Planning Janus34",
    "X-WR-TIMEZONE:Europe/Paris",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    ...parisTimeZone,
    ...events,
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n")
    .concat("\r\n");
}
