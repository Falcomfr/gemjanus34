import { beforeEach, expect, test, vi } from "vitest";
import { registerForConference } from "../actions";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerClient: vi.fn(async () => ({ rpc })) }));

const id = "11111111-1111-4111-8111-111111111111";
function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const values = { conferenceId: id, name: "Camille", contact: "06 12 34 56 78", seats: "2", consent: "on", website: "", ...overrides };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  rpc.mockResolvedValue({ data: "ok", error: null });
});

test("registers through the database, which checks the seats left", async () => {
  const state = await registerForConference({}, form());

  expect(rpc).toHaveBeenCalledWith("register_for_conference", { conference_id: id, name: "Camille", contact: "06 12 34 56 78", seats: 2 });
  expect(state.success).toMatch(/inscription est enregistrée/);
});

test.each([
  ["full", /plus assez de places/],
  ["closed", /fermées/],
  ["past", /déjà eu lieu/],
])("explains a refusal (%s)", async (result, message) => {
  rpc.mockResolvedValue({ data: result, error: null });
  const state = await registerForConference({}, form());
  expect(state.formError).toMatch(message);
});

test("a robot filling the trap gets a success and nothing is stored", async () => {
  const state = await registerForConference({}, form({ website: "spam" }));
  expect(rpc).not.toHaveBeenCalled();
  expect(state.success).toBeDefined();
});

test("points out a missing name, contact, consent or too many seats", async () => {
  const state = await registerForConference({}, form({ name: "", contact: "x", seats: "9", consent: "" }));
  expect(rpc).not.toHaveBeenCalled();
  expect(Object.keys(state.fieldErrors ?? {}).sort()).toEqual(["consent", "contact", "name", "seats"]);
});
