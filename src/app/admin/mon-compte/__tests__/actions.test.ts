import { beforeEach, expect, test, vi } from "vitest";
import { changeMyPassword, updateMyName } from "../actions";

const updateUser = vi.hoisted(() => vi.fn());
const verify = vi.hoisted(() => vi.fn());
const profileUpdate = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn(async () => ({ id: "u1", role: "editor", displayName: "Elif" })) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    auth: { updateUser, getUser: async () => ({ data: { user: { id: "u1", email: "elif@gemjanus34.fr" } } }) },
    from: () => ({ update: (values: unknown) => ({ eq: (_c: string, id: string) => profileUpdate(values, id) }) }),
  })),
}));
vi.mock("@/lib/supabase/verify-password", () => ({ verifyPassword: verify }));

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  updateUser.mockResolvedValue({ error: null });
  profileUpdate.mockResolvedValue({ error: null });
});

test("changes the password once the current one is confirmed", async () => {
  verify.mockResolvedValue(true);

  const state = await changeMyPassword({}, form({ currentPassword: "ancien-mot", newPassword: "nouveau-mot-long", confirmPassword: "nouveau-mot-long" }));

  expect(verify).toHaveBeenCalledWith("elif@gemjanus34.fr", "ancien-mot");
  expect(updateUser).toHaveBeenCalledWith({ password: "nouveau-mot-long" });
  expect(state.success).toBeDefined();
});

test("refuses a wrong current password", async () => {
  verify.mockResolvedValue(false);

  const state = await changeMyPassword({}, form({ currentPassword: "faux", newPassword: "nouveau-mot-long", confirmPassword: "nouveau-mot-long" }));

  expect(updateUser).not.toHaveBeenCalled();
  expect(state.fieldErrors?.currentPassword?.[0]).toMatch(/incorrect/);
});

test("updates one's display name", async () => {
  await updateMyName({}, form({ displayName: "Elif B." }));

  expect(profileUpdate).toHaveBeenCalledWith({ display_name: "Elif B." }, "u1");
});
