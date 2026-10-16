import { beforeEach, expect, test, vi } from "vitest";
import * as accountActions from "../actions";

const me = "10000000-0000-4000-8000-000000000001";
const other = "20000000-0000-4000-8000-000000000002";
const authAdmin = vi.hoisted(() => ({ createUser: vi.fn(), updateUserById: vi.fn(), deleteUser: vi.fn() }));
const db = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn(), activeAdmins: vi.fn(), current: vi.fn() }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn(async () => ({ id: me, role: "admin", displayName: "Moi" })) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ auth: { admin: authAdmin } }) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    from: () => ({
      insert: db.insert,
      update: (values: unknown) => ({ eq: (_column: string, id: string) => db.update(values, id) }),
      select: () => ({
        eq: (column: string, value: unknown) =>
          column === "id"
            ? { single: async () => db.current(value) }
            : { eq: async () => db.activeAdmins() },
      }),
    }),
  })),
}));

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  authAdmin.createUser.mockResolvedValue({ data: { user: { id: other } }, error: null });
  authAdmin.updateUserById.mockResolvedValue({ error: null });
  authAdmin.deleteUser.mockResolvedValue({ error: null });
  db.insert.mockResolvedValue({ error: null });
  db.update.mockResolvedValue({ error: null });
  db.activeAdmins.mockResolvedValue({ count: 2, error: null });
  db.current.mockResolvedValue({ data: { role: "admin", active: true }, error: null });
});

test("exports only async server actions", () => {
  for (const [name, value] of Object.entries(accountActions)) expect(value.constructor.name, name).toBe("AsyncFunction");
});

test("creates an account with a temporary password shown once", async () => {
  const state = await accountActions.createAccount({}, form({ email: "Elif@gemjanus34.fr", displayName: "Elif", role: "editor", active: "on" }));

  const password = authAdmin.createUser.mock.calls[0]![0].password;
  expect(authAdmin.createUser).toHaveBeenCalledWith({ email: "elif@gemjanus34.fr", password, email_confirm: true });
  expect(db.insert).toHaveBeenCalledWith({ id: other, display_name: "Elif", role: "editor", active: true, notify_on_publish: false });
  expect(state.temporaryPassword).toBe(password);
});

test("removes the login again when the profile cannot be created", async () => {
  db.insert.mockResolvedValue({ error: new Error("denied") });

  const state = await accountActions.createAccount({}, form({ email: "elif@gemjanus34.fr", displayName: "Elif", role: "editor", active: "on" }));

  expect(authAdmin.deleteUser).toHaveBeenCalledWith(other);
  expect(state.temporaryPassword).toBeUndefined();
  expect(state.formError).toBeDefined();
});

test("explains when the e-mail already has an account", async () => {
  authAdmin.createUser.mockResolvedValue({ data: { user: null }, error: { code: "email_exists", message: "exists" } });

  const state = await accountActions.createAccount({}, form({ email: "elif@gemjanus34.fr", displayName: "Elif", role: "editor", active: "on" }));

  expect(state.fieldErrors?.email?.[0]).toMatch(/existe déjà/);
});

test("refuses that admins demote or deactivate themselves", async () => {
  const state = await accountActions.updateAccount({}, form({ userId: me, email: "moi@x.fr", displayName: "Moi", role: "editor", active: "on" }));

  expect(db.update).not.toHaveBeenCalled();
  expect(state.formError).toMatch(/votre propre compte/);
});

test("always keeps one active administrator", async () => {
  db.activeAdmins.mockResolvedValue({ count: 1, error: null });

  const state = await accountActions.updateAccount({}, form({ userId: other, email: "x@x.fr", displayName: "Autre", role: "editor", active: "on" }));

  expect(db.update).not.toHaveBeenCalled();
  expect(state.formError).toMatch(/au moins un administrateur/);
});

test("updates another account", async () => {
  await accountActions.updateAccount({}, form({ userId: other, email: "x@x.fr", displayName: "Elif B.", role: "admin", active: "on" }));

  expect(db.update).toHaveBeenCalledWith({ display_name: "Elif B.", role: "admin", active: true }, other);
});

test("resets a password to a new temporary one", async () => {
  const state = await accountActions.resetAccountPassword({}, form({ userId: other }));

  const password = authAdmin.updateUserById.mock.calls[0]![1].password;
  expect(authAdmin.updateUserById).toHaveBeenCalledWith(other, { password });
  expect(state.temporaryPassword).toBe(password);
});

test("refuses to delete one's own account, and explains when content blocks a deletion", async () => {
  expect((await accountActions.deleteAccount({}, form({ userId: me }))).formError).toMatch(/votre propre compte/);

  authAdmin.deleteUser.mockResolvedValue({ error: { message: "violates foreign key constraint" } });
  db.current.mockResolvedValue({ data: { role: "editor", active: true }, error: null });
  expect((await accountActions.deleteAccount({}, form({ userId: other }))).formError).toMatch(/désactivez-le/);
});
