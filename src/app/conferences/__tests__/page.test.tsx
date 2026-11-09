import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import ConferencesPage from "../page";

const settings = vi.hoisted(() => ({ current: { conferencesEnabled: true, registrationsEnabled: true } }));
const notFound = vi.hoisted(() => vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("../actions", () => ({ registerForConference: vi.fn() }));
vi.mock("@/lib/settings/site-settings", () => ({ getSiteSettings: vi.fn(async () => settings.current) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        order: async () => ({
          data: [
            { id: "c0", title: "La mémoire", speaker: null, starts_at: "2026-10-01T16:00:00Z", place: "Au GEM", description: "", capacity: 20 },
            { id: "c1", title: "Le sommeil", speaker: "Dr Martin", starts_at: "2026-12-03T17:30:00Z", place: "Au GEM", description: "Mieux dormir.", capacity: 30 },
            { id: "c2", title: "Complet", speaker: null, starts_at: "2026-12-10T17:30:00Z", place: "Au GEM", description: "", capacity: 4 },
          ],
          error: null,
        }),
      }),
    }),
    rpc: async () => ({ data: [{ conference_id: "c1", seats: 12 }, { conference_id: "c2", seats: 4 }], error: null }),
  })),
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-09T10:00:00Z"));
  settings.current = { conferencesEnabled: true, registrationsEnabled: true };
});
afterEach(() => vi.useRealTimers());

test("shows the coming conferences with the seats left and a form to register", async () => {
  render(await ConferencesPage());

  const sommeil = screen.getByRole("article", { name: "Le sommeil" });
  expect(sommeil).toHaveTextContent("Dr Martin");
  expect(sommeil).toHaveTextContent("18 places restantes");
  expect(within(sommeil).getByRole("button", { name: /m’inscrire/i })).toBeInTheDocument();

  const full = screen.getByRole("article", { name: "Complet" });
  expect(full).toHaveTextContent(/complet/i);
  expect(within(full).queryByRole("button", { name: /m’inscrire/i })).not.toBeInTheDocument();
});

test("lists past conferences apart, without a form", async () => {
  render(await ConferencesPage());
  const past = screen.getByRole("region", { name: "Conférences passées" });
  expect(past).toHaveTextContent("La mémoire");
  expect(within(past).queryByRole("button")).not.toBeInTheDocument();
});

test("says to call when the registrations are closed", async () => {
  settings.current = { conferencesEnabled: true, registrationsEnabled: false };
  render(await ConferencesPage());
  expect(screen.queryByRole("button", { name: /m’inscrire/i })).not.toBeInTheDocument();
  expect(screen.getAllByText(/inscription par téléphone/i).length).toBeGreaterThan(0);
});

test("does not exist while switched off", async () => {
  settings.current = { conferencesEnabled: false, registrationsEnabled: false };
  await expect(ConferencesPage()).rejects.toThrow("NEXT_NOT_FOUND");
});
