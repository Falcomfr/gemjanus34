import { expect, test, vi } from "vitest";
import AdminLayout from "../layout";

const getUser = vi.hoisted(() => vi.fn());
const profileRow = vi.hoisted(() => ({ current: { id: "u" } as { id: string } | null }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-janus-admin-pathname": "/admin/connexion" }) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((to: string) => { throw new Error(`REDIRECT ${to}`); }) }));
vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerClient: vi.fn(async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profileRow.current, error: null }) }) }) }) }),
  })) }));

test("sends someone already signed in from the login page to the dashboard", async () => {
  getUser.mockResolvedValue({ data: { user: { id: "u" } }, error: null });

  await expect(AdminLayout({ children: null })).rejects.toThrow("REDIRECT /admin");
});

test("shows the login page to visitors who are not signed in", async () => {
  getUser.mockResolvedValue({ data: { user: null }, error: null });

  await expect(AdminLayout({ children: null })).resolves.toBeTruthy();
});

test("keeps the login page reachable for a session without an active profile", async () => {
  getUser.mockResolvedValue({ data: { user: { id: "u" } }, error: null });
  profileRow.current = null;

  await expect(AdminLayout({ children: null })).resolves.toBeTruthy();
  profileRow.current = { id: "u" };
});
