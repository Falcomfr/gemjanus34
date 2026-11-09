import { contact } from "@/content/contact";
import { parseConferenceForm } from "../conference-input";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const values = { title: "Le sommeil", speaker: "Dr Martin", startsAt: "2026-12-03T18:30", place: "Maison des associations", description: "Mieux dormir.", capacity: "30", ...overrides };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

test("reads a conference, its Paris time turned into an instant", () => {
  expect(parseConferenceForm(form())).toEqual({
    success: true,
    data: { title: "Le sommeil", speaker: "Dr Martin", startsAt: "2026-12-03T17:30:00Z", place: "Maison des associations", description: "Mieux dormir.", capacity: 30 },
  });
});

test("an empty place means the GEM, empty speaker and capacity mean none", () => {
  const result = parseConferenceForm(form({ place: "", speaker: " ", capacity: "" }));
  expect(result.success && [result.data.place, result.data.speaker, result.data.capacity]).toEqual([`${contact.street}, ${contact.city}`, null, null]);
});

test("points out a missing title, a wrong date and an impossible capacity", () => {
  const result = parseConferenceForm(form({ title: "", startsAt: "demain", capacity: "0" }));
  expect(result.success).toBe(false);
  if (!result.success) expect(Object.keys(result.fieldErrors).sort()).toEqual(["capacity", "startsAt", "title"]);
});
