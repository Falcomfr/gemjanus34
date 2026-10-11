const PARIS_TIME_ZONE = "Europe/Paris";
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const publicDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: PARIS_TIME_ZONE,
});

const parisCalendarFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: PARIS_TIME_ZONE,
});

function parseInstant(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Invalid public date: ${value}`);
  }

  return date;
}

function parseDateOnly(value: string): Date {
  const date = parseInstant(`${value}T12:00:00Z`);
  const normalized = date.toISOString().slice(0, 10);

  if (normalized !== value) {
    throw new RangeError(`Invalid public date: ${value}`);
  }

  return date;
}

function parisCalendarDate(value: Date): string {
  const parts = parisCalendarFormatter.formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new RangeError(`Unable to format public date: ${value.toISOString()}`);
  }

  return `${year}-${month}-${day}`;
}

export function formatPublicDate(value: string): string {
  const date = DATE_ONLY_PATTERN.test(value) ? parseDateOnly(value) : parseInstant(value);
  return publicDateFormatter.format(date);
}

export function isCurrentOrFuturePublicDate(value: string, now: string): boolean {
  const currentInstant = parseInstant(now);

  if (DATE_ONLY_PATTERN.test(value)) {
    parseDateOnly(value);
    return value >= parisCalendarDate(currentInstant);
  }

  return parseInstant(value).getTime() >= currentInstant.getTime();
}
