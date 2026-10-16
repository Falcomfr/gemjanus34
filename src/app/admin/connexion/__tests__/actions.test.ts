import { expect, test, vi } from "vitest";
import { logout } from "../actions";

const signOut = vi.hoisted(() => vi.fn(async () => ({ error: null })));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    auth: { signOut, signInWithPassword: async () => ({ data: { user: { id: "u-old" } }, error: null }) },
    from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) }),
  })),
}));

test("logging out on one device keeps the other sessions open", async () => {
  await expect(logout()).rejects.toThrow("NEXT_REDIRECT");

  expect(signOut).toHaveBeenCalledWith({ scope: "local" });
});

test("refuses a deactivated account with a clear message", async () => {
  const { login } = await import("../actions");
  const data = new FormData();
  data.set("email", "ancienne@gemjanus34.fr");
  data.set("password", "un-mot-de-passe");

  const state = await login({}, data);

  expect(state.error).toMatch(/désactivé/);
  expect(signOut).toHaveBeenCalledWith({ scope: "local" });
});
