import { beforeEach, expect, test, vi } from "vitest";
import { saveSiteSettings } from "../actions";

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
