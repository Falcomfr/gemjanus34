import { expect, test, vi } from "vitest";
import { logout } from "../actions";

const signOut = vi.hoisted(() => vi.fn(async () => ({ error: null })));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({ auth: { signOut } })),
}));

test("logging out on one device keeps the other sessions open", async () => {
  await expect(logout()).rejects.toThrow("NEXT_REDIRECT");

  expect(signOut).toHaveBeenCalledWith({ scope: "local" });
});
