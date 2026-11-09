import { beforeEach, expect, test, vi } from "vitest";
import { resetTheme, saveSiteSettings, saveTheme } from "../actions";

const update = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const profile = vi.hoisted(() => ({ current: { id: "u1", role: "admin" } }));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn(async () => profile.current) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({ from: () => ({ update: (values: unknown) => ({ eq: () => update(values) }) }) })),
}));

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  profile.current = { id: "u1", role: "admin" };
  update.mockResolvedValue({ error: null });
});

test("only an administrator changes the settings", async () => {
  profile.current = { id: "u2", role: "manager" };

  const state = await saveSiteSettings({}, form({ callbackEnabled: "on" }));

  expect(update).not.toHaveBeenCalled();
  expect(state.formError).toMatch(/administrateurs/);
});

test("refuses an address that is not a HelloAsso page", async () => {
  const state = await saveSiteSettings({}, form({ membershipEnabled: "on", helloassoUrl: "https://evil.test/don" }));

  expect(update).not.toHaveBeenCalled();
  expect(state.fieldErrors?.helloassoUrl).toBeDefined();
});

test("saves the switches and refreshes the whole site", async () => {
  const state = await saveSiteSettings(
    {},
    form({ callbackEnabled: "on", membershipEnabled: "on", galleryEnabled: "on", helloassoUrl: " https://www.helloasso.com/associations/janus34 " }),
  );

  expect(update).toHaveBeenCalledWith({
    callback_enabled: true,
    membership_enabled: true,
    helloasso_url: "https://www.helloasso.com/associations/janus34",
    gallery_enabled: true,
    updated_at: expect.any(String),
  });
  expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  expect(state.success).toBeDefined();
});

test("an empty address and unchecked boxes switch everything off", async () => {
  await saveSiteSettings({}, form({ helloassoUrl: "" }));

  expect(update).toHaveBeenCalledWith(expect.objectContaining({ callback_enabled: false, membership_enabled: false, helloasso_url: null, gallery_enabled: false }));
});

const theme = { forest: "#123456", coral: "#a83020", sun: "#f2c14e", background: "#ffffff", text: "#111111" };

test("only an administrator changes the colours", async () => {
  profile.current = { id: "u2", role: "manager" };

  const state = await saveTheme({}, form(theme));

  expect(update).not.toHaveBeenCalled();
  expect(state.formError).toMatch(/administrateurs/);
});

test("refuses colours that make the site hard to read, and says which", async () => {
  const state = await saveTheme({}, form({ ...theme, text: "#eeeeee" }));

  expect(update).not.toHaveBeenCalled();
  expect(state.formError).toMatch(/texte/i);
});

test("saves readable colours for the whole site", async () => {
  const state = await saveTheme({}, form({ ...theme, coral: "#A83020" }));

  expect(update).toHaveBeenCalledWith({ theme, updated_at: expect.any(String) });
  expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  expect(state.success).toBeDefined();
});

test("goes back to the original colours", async () => {
  const state = await resetTheme();

  expect(update).toHaveBeenCalledWith({ theme: null, updated_at: expect.any(String) });
  expect(state.success).toMatch(/origine/);
});
