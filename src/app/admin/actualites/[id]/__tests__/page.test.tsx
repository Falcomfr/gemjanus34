import { expect, test, vi } from "vitest";
import EditAdminNewsPage from "../page";

const createServerClient = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ notFound: vi.fn(() => { throw new Error("NOT_FOUND"); }) }));
vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn(async () => ({ id: "u", role: "admin" })) }));
vi.mock("@/lib/supabase/server", () => ({ createServerClient }));

test("answers a malformed news id with a 404, without querying", async () => {
  await expect(EditAdminNewsPage({ params: Promise.resolve({ id: "pas-un-id" }) })).rejects.toThrow("NOT_FOUND");
  expect(createServerClient).not.toHaveBeenCalled();
});
