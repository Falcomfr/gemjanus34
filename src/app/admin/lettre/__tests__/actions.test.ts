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

test("keeps the paragraphs sent by the browser, whose line breaks arrive as CRLF", async () => {
  await saveLetterNote({}, form("Bonjour à tous.\r\n\r\nSortie vendredi."));
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ note: "Bonjour à tous.\n\nSortie vendredi." }));
});

test("counts a line break as one character, as the text box does", async () => {
  // 1 502 characters as sent, 1 500 once each break counts as one.
  const state = await saveLetterNote({}, form(`${"x".repeat(749)}\r\n\r\n${"y".repeat(749)}`));
  expect(state.formError).toBeUndefined();
});
