import {
  formatPublicDate,
  isCurrentOrFuturePublicDate,
  publicDateTimestamp,
} from "../public-date";

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

test.each([
  "2026-02-30T12:00:00Z",
  "2026-13-01T12:00:00Z",
  "2026-10-15T24:00:00Z",
  "2026-10-15T12:60:00Z",
  "2026-10-15T12:00:60Z",
  "2026-10-15T12:00:00+24:00",
  "2026-10-15T12:00:00+02:60",
  "2026-10-15T12:00:00",
  "October 15, 2026",
])("rejects invalid or unsupported public timestamp %s", (value) => {
  expect(() => formatPublicDate(value)).toThrow(RangeError);
});

test.each(["2026-02-30", "2026-13-01", "2026-00-01", "2026-01-00"])(
  "rejects invalid calendar date %s",
  (value) => {
    expect(() => formatPublicDate(value)).toThrow(RangeError);
  },
);

test("returns equal chronological timestamps for offset-equivalent instants", () => {
  expect(publicDateTimestamp("2026-10-15T10:00:00+02:00")).toBe(
    publicDateTimestamp("2026-10-15T08:00:00Z"),
  );
});

test("orders timestamps by their instant when offsets differ", () => {
  expect(publicDateTimestamp("2026-10-15T10:00:00+02:00")).toBeLessThan(
    publicDateTimestamp("2026-10-15T09:00:00Z"),
  );
});
