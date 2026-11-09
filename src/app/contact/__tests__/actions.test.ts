import { beforeEach, expect, test, vi } from "vitest";
import { sendContactMessage } from "../actions";

const insert = vi.hoisted(() => vi.fn());
const createServerClient = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
const sendContactAlert = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({ createServerClient }));
vi.mock("@/lib/contact/alert-email", () => ({ sendContactAlert }));

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const values = {
    name: "Camille Martin",
    email: "camille@example.test",
    subject: "Première visite",
    message: "Bonjour, je voudrais venir découvrir le GEM la semaine prochaine.",
    consent: "on",
    website: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  createServerClient.mockResolvedValue({ from: () => ({ insert }) });
});

test("records a valid message and only then confirms it", async () => {
  insert.mockResolvedValue({ error: null });

  const state = await sendContactMessage({}, form());

  expect(insert).toHaveBeenCalledWith({
    name: "Camille Martin",
    email: "camille@example.test",
    subject: "Première visite",
    message: "Bonjour, je voudrais venir découvrir le GEM la semaine prochaine.",
  });
  expect(state.success).toMatch(/bien été envoyé/);
});

test("does not claim success when the message cannot be recorded", async () => {
  insert.mockResolvedValue({ error: new Error("down") });

  const state = await sendContactMessage({}, form());

  expect(state.success).toBeUndefined();
  expect(state.formError).toMatch(/04 67 04 87 68/);
});

test("does not claim success when the site has no message storage", async () => {
  createServerClient.mockRejectedValue(new Error("missing configuration"));

  const state = await sendContactMessage({}, form());

  expect(state.success).toBeUndefined();
  expect(state.formError).toMatch(/04 67 04 87 68/);
});

test("points out invalid fields and the missing consent", async () => {
  const state = await sendContactMessage({}, form({ email: "pas-un-mail", consent: "" }));

  expect(insert).not.toHaveBeenCalled();
  expect(Object.keys(state.fieldErrors ?? {}).sort()).toEqual(["consent", "email"]);
});

test("silently drops submissions that fill the hidden trap field", async () => {
  const state = await sendContactMessage({}, form({ website: "https://spam.example" }));

  expect(insert).not.toHaveBeenCalled();
  expect(state.success).toBeDefined();
});

test("alerts the team once the message is stored", async () => {
  insert.mockResolvedValue({ error: null });

  await sendContactMessage({}, form());

  expect(sendContactAlert).toHaveBeenCalledWith({
    kind: "message",
    name: "Camille Martin",
    email: "camille@example.test",
    subject: "Première visite",
    message: "Bonjour, je voudrais venir découvrir le GEM la semaine prochaine.",
  });
});

test("sends no alert when the message could not be stored", async () => {
  insert.mockResolvedValue({ error: { message: "down" } });

  await sendContactMessage({}, form());

  expect(sendContactAlert).not.toHaveBeenCalled();
});
