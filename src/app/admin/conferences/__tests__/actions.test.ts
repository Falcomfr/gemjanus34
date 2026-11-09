import { beforeEach, expect, test, vi } from "vitest";
import { createConference, deleteConference, deleteRegistration } from "../actions";

const insert = vi.hoisted(() => vi.fn());
const remove = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const tables = vi.hoisted(() => [] as string[]);
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn(async () => ({ id: "u1", role: "editor" })) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    from: (table: string) => {
      tables.push(table);
      return { insert, delete: () => ({ eq: remove }) };
    },
  })),
}));

const id = "11111111-1111-4111-8111-111111111111";
const form = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};

beforeEach(() => {
  vi.clearAllMocks();
  tables.length = 0;
  insert.mockResolvedValue({ error: null });
  remove.mockResolvedValue({ error: null });
});

test("adds a conference for the team", async () => {
  const state = await createConference({}, form({ title: "Le sommeil", speaker: "", startsAt: "2026-12-03T18:30", place: "", description: "", capacity: "30" }));

  expect(insert).toHaveBeenCalledWith(expect.objectContaining({ title: "Le sommeil", starts_at: "2026-12-03T17:30:00Z", capacity: 30, speaker: null, created_by: "u1" }));
  expect(revalidatePath).toHaveBeenCalledWith("/conferences");
  expect(state.success).toBeDefined();
});

test("points out the fields to correct", async () => {
  const state = await createConference({}, form({ title: "", startsAt: "", capacity: "" }));
  expect(insert).not.toHaveBeenCalled();
  expect(state.fieldErrors?.title).toBeDefined();
});

test("removes a conference, its registrations going with it", async () => {
  const state = await deleteConference({}, form({ conferenceId: id }));
  expect(tables).toEqual(["conferences"]);
  expect(remove).toHaveBeenCalledWith("id", id);
  expect(state.success).toBeDefined();
});

test("removes one registration", async () => {
  const state = await deleteRegistration({}, form({ registrationId: id }));
  expect(tables).toEqual(["conference_registrations"]);
  expect(state.success).toBeDefined();
});

test("refuses an invalid identifier", async () => {
  const state = await deleteRegistration({}, form({ registrationId: "x" }));
  expect(remove).not.toHaveBeenCalled();
  expect(state.formError).toBeDefined();
});
