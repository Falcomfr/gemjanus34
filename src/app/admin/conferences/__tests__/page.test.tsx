import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import AdminConferencesPage from "../page";

vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn(async () => ({ id: "u1", role: "editor" })) }));
vi.mock("../actions", () => ({ createConference: vi.fn(), deleteConference: vi.fn(), deleteRegistration: vi.fn() }));
vi.mock("@/lib/settings/site-settings", () => ({ getSiteSettings: vi.fn(async () => ({ conferencesEnabled: false, registrationsEnabled: false })) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        order: async () => ({
          data: [
            {
              id: "c1", title: "Le sommeil", speaker: "Dr Martin", starts_at: "2026-12-03T17:30:00Z", place: "Au GEM", description: "", capacity: 30,
              conference_registrations: [{ id: "r1", name: "Camille", contact: "06 12 34 56 78", seats: 2, created_at: "2026-11-09T10:00:00Z" }],
            },
            { id: "c2", title: "Ancienne", speaker: null, starts_at: "2026-06-01T17:30:00Z", place: "Au GEM", description: "", capacity: null, conference_registrations: [] },
          ],
          error: null,
        }),
      }),
    }),
  })),
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-09T10:00:00Z"));
});
afterEach(() => vi.useRealTimers());

test("lists each conference with its registrations and seats left", async () => {
  render(await AdminConferencesPage());

  const sommeil = screen.getByRole("article", { name: /le sommeil/i });
  expect(sommeil).toHaveTextContent("2 places prises sur 30");
  expect(within(sommeil).getByRole("cell", { name: "Camille" })).toBeInTheDocument();
  expect(within(sommeil).getByRole("button", { name: /retirer camille/i })).toBeInTheDocument();
});

test("flags a conference over for more than three months", async () => {
  render(await AdminConferencesPage());
  expect(screen.getByRole("article", { name: /ancienne/i })).toHaveTextContent(/à supprimer/i);
});

test("says when the page is not shown on the site", async () => {
  render(await AdminConferencesPage());
  expect(screen.getByText(/pas encore visible sur le site/i)).toBeInTheDocument();
});
