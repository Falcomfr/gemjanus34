import { expect, test } from "vitest";
import { GET } from "../route";

test("serves an empty calendar so former subscribers lose the repeated activities", async () => {
  const response = await GET();

  expect(response.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
  const body = await response.text();
  expect(body).toContain("BEGIN:VCALENDAR");
  expect(body).not.toContain("BEGIN:VEVENT");
});
