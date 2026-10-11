import { formatPublicDate, isCurrentOrFuturePublicDate } from "../public-date";

test("formats date-only values as their Europe/Paris calendar date", () => {
  expect(formatPublicDate("2026-10-15")).toBe("15 octobre 2026");
});

test("formats full ISO timestamps as Europe/Paris instants", () => {
  expect(formatPublicDate("2026-10-15T23:30:00Z")).toBe("16 octobre 2026");
});

test("keeps date-only values current through the end of their Europe/Paris day", () => {
  expect(isCurrentOrFuturePublicDate("2026-10-12", "2026-10-11T22:30:00Z")).toBe(true);
  expect(isCurrentOrFuturePublicDate("2026-10-12", "2026-10-12T22:00:00Z")).toBe(false);
});

test("compares full ISO timestamps as exact instants", () => {
  expect(
    isCurrentOrFuturePublicDate("2026-10-12T00:15:00+02:00", "2026-10-11T22:10:00Z"),
  ).toBe(true);
  expect(
    isCurrentOrFuturePublicDate("2026-10-12T00:15:00+02:00", "2026-10-11T22:20:00Z"),
  ).toBe(false);
});
