const PARIS_TIME_ZONE = "Europe/Paris";
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/;

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

function invalidPublicDate(value: string): RangeError {
  return new RangeError(`Invalid public date: ${value}`);
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1]!;
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  if (!isValidCalendarDate(year!, month!, day!)) {
    throw invalidPublicDate(value);
  }

  return new Date(`${value}T12:00:00Z`);
}

function parseTimestamp(value: string): Date {
  const match = TIMESTAMP_PATTERN.exec(value);

  if (!match) {
    throw invalidPublicDate(value);
  }

  const [, yearValue, monthValue, dayValue, hourValue, minuteValue, secondValue, offsetHourValue, offsetMinuteValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const second = Number(secondValue);
  const offsetHour = offsetHourValue === undefined ? 0 : Number(offsetHourValue);
  const offsetMinute = offsetMinuteValue === undefined ? 0 : Number(offsetMinuteValue);

  if (
    !isValidCalendarDate(year, month, day) ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    offsetHour > 23 ||
    offsetMinute > 59
  ) {
    throw invalidPublicDate(value);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw invalidPublicDate(value);
  }

  return date;
}

function parsePublicDate(value: string): Date {
  return DATE_ONLY_PATTERN.test(value) ? parseDateOnly(value) : parseTimestamp(value);
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
  return publicDateFormatter.format(parsePublicDate(value));
}

export function publicDateTimestamp(value: string): number {
  return parsePublicDate(value).getTime();
}

export function isCurrentOrFuturePublicDate(value: string, now: string): boolean {
  const currentInstant = parsePublicDate(now);

  if (DATE_ONLY_PATTERN.test(value)) {
    parseDateOnly(value);
    return value >= parisCalendarDate(currentInstant);
  }

  return publicDateTimestamp(value) >= currentInstant.getTime();
}

const parisTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: PARIS_TIME_ZONE,
});

function publicTime(value: string): string {
  const [hour, minute] = parisTimeFormatter.format(parsePublicDate(value)).split(":");
  return `${Number(hour)} h${minute === "00" ? "" : ` ${minute}`}`;
}

function publicMoment(value: string): string {
  return DATE_ONLY_PATTERN.test(value) ? formatPublicDate(value) : `${formatPublicDate(value)} à ${publicTime(value)}`;
}

// "8 octobre 2026 à 10 h", "8 octobre 2026, de 10 h à 13 h 30", "du … au …", in Paris time.
export function formatPublicDateRange(startsAt: string, endsAt: string | null): string {
  if (!endsAt) return publicMoment(startsAt);
  const timed = !DATE_ONLY_PATTERN.test(startsAt) && !DATE_ONLY_PATTERN.test(endsAt);
  if (timed && formatPublicDate(startsAt) === formatPublicDate(endsAt)) {
    return `${formatPublicDate(startsAt)}, de ${publicTime(startsAt)} à ${publicTime(endsAt)}`;
  }
  return `du ${publicMoment(startsAt)} au ${publicMoment(endsAt)}`;
}
