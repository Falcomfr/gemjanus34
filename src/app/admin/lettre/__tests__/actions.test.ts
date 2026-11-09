import { beforeEach, expect, test, vi } from "vitest";
import { saveLetterNote } from "../actions";

const update = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn(async () => ({ id: "u1", role: "editor" })) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({ from: () => ({ update: (values: unknown) => ({ eq: () => update(values) }) }) })),
}));

const form = (note: string) => {
  const data = new FormData();
  data.set("note", note);
  return data;
};

beforeEach(() => {
  vi.clearAllMocks();
  update.mockResolvedValue({ error: null });
});

test("the team saves the note of the letter", async () => {
  const state = await saveLetterNote({}, form("  Bonne semaine !  "));

  expect(update).toHaveBeenCalledWith({ note: "Bonne semaine !", updated_by: "u1", updated_at: expect.any(String) });
  expect(revalidatePath).toHaveBeenCalledWith("/lettre");
  expect(state.success).toBeDefined();
});

test("refuses a note over 1 500 characters", async () => {
  const state = await saveLetterNote({}, form("x".repeat(1501)));

  expect(update).not.toHaveBeenCalled();
  expect(state.formError).toMatch(/1 500/);
});
