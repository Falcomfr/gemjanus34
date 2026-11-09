import { beforeEach, expect, test, vi } from "vitest";
import { defaultSiteSettings, getSiteSettings, membershipHref } from "../site-settings";

const single = vi.hoisted(() => vi.fn());
const createServerClient = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({ createServerClient }));

beforeEach(() => {
  vi.clearAllMocks();
  createServerClient.mockResolvedValue({ from: () => ({ select: () => ({ single }) }) });
});

test("reads the switches of the site", async () => {
  single.mockResolvedValue({
    data: { callback_enabled: false, membership_enabled: true, helloasso_url: "https://www.helloasso.com/associations/janus34", gallery_enabled: true, theme: { forest: "#123456" } },
    error: null,
  });

  await expect(getSiteSettings()).resolves.toEqual({
    callbackEnabled: false,
    membershipEnabled: true,
    helloassoUrl: "https://www.helloasso.com/associations/janus34",
    galleryEnabled: true,
    theme: { forest: "#123456" },
  });
});

test("falls back to the defaults when the settings cannot be read", async () => {
  single.mockResolvedValue({ data: null, error: { message: "down" } });
  await expect(getSiteSettings()).resolves.toEqual(defaultSiteSettings);

  createServerClient.mockRejectedValue(new Error("no Supabase"));
  await expect(getSiteSettings()).resolves.toEqual(defaultSiteSettings);
});

test("defaults keep the call-me-back form on, the membership link and the gallery off", () => {
  expect(defaultSiteSettings).toEqual({ callbackEnabled: true, membershipEnabled: false, helloassoUrl: null, galleryEnabled: false, theme: null });
});

test("shows the membership link only when it is switched on and has an address", () => {
  const url = "https://www.helloasso.com/associations/janus34";
  expect(membershipHref({ ...defaultSiteSettings, membershipEnabled: false, helloassoUrl: url })).toBeNull();
  expect(membershipHref({ ...defaultSiteSettings, membershipEnabled: true, helloassoUrl: null })).toBeNull();
  expect(membershipHref({ ...defaultSiteSettings, membershipEnabled: true, helloassoUrl: url })).toBe(url);
});
