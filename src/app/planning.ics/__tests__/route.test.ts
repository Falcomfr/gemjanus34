import { expect, test, vi } from "vitest";
import { bundledPlanning } from "@/content/planning";
import { GET } from "../route";

vi.mock("@/lib/content/public-repository", () => ({
  getPublicContentRepository: () => ({ getPlanning: async () => bundledPlanning }),
}));

test("serves the planning as a calendar feed", async () => {
  const response = await GET();

  expect(response.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
  const body = await response.text();
  expect(body).toContain("BEGIN:VCALENDAR");
  expect(body).toContain("BEGIN:VEVENT");
});
