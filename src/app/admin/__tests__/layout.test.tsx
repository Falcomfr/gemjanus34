import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import AdminLayout from "../layout";

const getUser = vi.hoisted(() => vi.fn());
const profileRow = vi.hoisted(() => ({ current: { id: "u" } as { id: string } | null }));
const pathname = vi.hoisted(() => ({ current: "/admin/connexion" }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-janus-admin-pathname": pathname.current }) }));
vi.mock("next/link", () => ({ default: ({ href, ...props }: { href: string }) => <a href={href} {...props} /> }));
vi.mock("@/app/admin/connexion/actions", () => ({ logout: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((to: string) => { throw new Error(`REDIRECT ${to}`); }) }));
vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn(async () => ({ id: "u", displayName: "Camille", role: "editor", active: true })) }));
const counts = vi.hoisted((): Record<string, number | null> => ({ contact_messages: 2, pages: 0, news: 1 }));
vi.mock("@/lib/supabase/server", () => ({ createServerClient: vi.fn(async () => ({
    auth: { getUser },
    from: (table: string) => ({
      select: () => ({
        eq: (column: string) =>
          column === "status"
            ? Promise.resolve({ count: counts[table], error: null })
            : { eq: () => ({ maybeSingle: async () => ({ data: profileRow.current, error: null }) }) },
        is: async () => ({ count: counts[table], error: null }),
      }),
    }),
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

test("counts what waits in the admin for the menu", async () => {
  pathname.current = "/admin";
  counts.pages = null;
  render(await AdminLayout({ children: null }));
  pathname.current = "/admin/connexion";

  expect(screen.getByRole("link", { name: "Messages 2 à traiter" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Actualités 1 brouillon" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Pages" })).toBeInTheDocument();
});
