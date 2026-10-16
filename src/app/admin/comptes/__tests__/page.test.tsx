import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import AdminAccountsPage from "../page";

const role = vi.hoisted(() => ({ current: "admin" }));
vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn(async () => ({ id: "u1", role: role.current, displayName: "Moi" })) }));
vi.mock("../actions", () => ({ createAccount: vi.fn(), updateAccount: vi.fn(), resetAccountPassword: vi.fn(), deleteAccount: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { listUsers: async () => ({ data: { users: [
      { id: "u1", email: "moi@gemjanus34.fr", last_sign_in_at: "2026-10-16T10:00:00Z" },
      { id: "u2", email: "elif@gemjanus34.fr", last_sign_in_at: null },
    ] }, error: null }) } },
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    from: () => ({ select: () => ({ order: async () => ({ data: [
      { id: "u1", display_name: "Moi", role: "admin", active: true },
      { id: "u2", display_name: "Elif", role: "editor", active: false },
    ], error: null }) }) }),
  })),
}));

test("lists every account with its e-mail, role, state and last sign-in", async () => {
  role.current = "admin";
  render(await AdminAccountsPage());

  const elif = screen.getByRole("article", { name: "Elif" });
  expect(elif).toHaveTextContent("elif@gemjanus34.fr");
  expect(elif).toHaveTextContent("Désactivé");
  expect(elif).toHaveTextContent("Jamais connecté");
  expect(within(elif).getByRole("button", { name: /réinitialiser le mot de passe/i })).toBeInTheDocument();
  expect(screen.getByRole("article", { name: "Moi" })).toHaveTextContent("Vous");
  expect(screen.getByRole("button", { name: "Créer le compte" })).toBeInTheDocument();
});

test("is reserved to administrators", async () => {
  role.current = "editor";
  render(await AdminAccountsPage());

  expect(screen.getByText(/réservée aux administrateurs/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Créer le compte" })).not.toBeInTheDocument();
});
