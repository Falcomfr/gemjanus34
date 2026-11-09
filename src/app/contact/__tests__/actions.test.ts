import { beforeEach, expect, test, vi } from "vitest";
import { sendCallbackRequest, sendContactMessage } from "../actions";

const insert = vi.hoisted(() => vi.fn());
const createServerClient = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
const sendContactAlert = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({ createServerClient }));
vi.mock("@/lib/contact/alert-email", () => ({ sendContactAlert }));
const settings = vi.hoisted(() => ({ current: { callbackEnabled: true, membershipEnabled: false, helloassoUrl: null } }));
vi.mock("@/lib/settings/site-settings", () => ({ getSiteSettings: vi.fn(async () => settings.current) }));

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
  settings.current = { callbackEnabled: true, membershipEnabled: false, helloassoUrl: null };
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

function callbackForm(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const values = { name: "Sam", phone: "06 12 34 56 78", preferredTime: "Le matin", consent: "on", website: "", ...overrides };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

test("stores a call-me-back request and alerts the team", async () => {
  insert.mockResolvedValue({ error: null });

  const state = await sendCallbackRequest({}, callbackForm());

  expect(insert).toHaveBeenCalledWith({ kind: "callback", name: "Sam", phone: "06 12 34 56 78", message: "Le matin" });
  expect(sendContactAlert).toHaveBeenCalledWith({ kind: "callback", name: "Sam", phone: "06 12 34 56 78", subject: "Demande de rappel", message: "Le matin" });
  expect(state.success).toBe("Merci, l’équipe vous rappellera.");
});

test("a robot filling the trap gets a success and stores nothing", async () => {
  const state = await sendCallbackRequest({}, callbackForm({ website: "spam" }));

  expect(insert).not.toHaveBeenCalled();
  expect(state.success).toBeDefined();
});

test("refuses a request while the form is switched off", async () => {
  settings.current = { ...settings.current, callbackEnabled: false };

  const state = await sendCallbackRequest({}, callbackForm());

  expect(insert).not.toHaveBeenCalled();
  expect(state.formError).toBeDefined();
});

test("points out a wrong phone number", async () => {
  const state = await sendCallbackRequest({}, callbackForm({ phone: "123" }));

  expect(insert).not.toHaveBeenCalled();
  expect(state.fieldErrors?.phone).toBeDefined();
});
