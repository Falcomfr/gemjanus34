import { generateTemporaryPassword, parseAccountForm, parsePasswordChange } from "../account-input";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

test("accepts a new account with a trimmed, lower-case e-mail", () => {
  expect(parseAccountForm(form({ email: " Elif@GemJanus34.fr ", displayName: "Elif", role: "editor", active: "on" }))).toEqual({
    success: true,
    data: { email: "elif@gemjanus34.fr", displayName: "Elif", role: "editor", active: true },
  });
});

test("points out an invalid e-mail, a too short name and an unknown role", () => {
  const result = parseAccountForm(form({ email: "pas-un-mail", displayName: "E", role: "superadmin" }));

  expect(result.success).toBe(false);
  if (!result.success) expect(Object.keys(result.fieldErrors).sort()).toEqual(["displayName", "email", "role"]);
});

test("generates strong, readable temporary passwords", () => {
  const passwords = new Set(Array.from({ length: 20 }, generateTemporaryPassword));

  expect(passwords.size).toBe(20);
  for (const password of passwords) {
    expect(password).toMatch(/^[A-Za-z0-9-]{14,}$/);
    expect(password).not.toMatch(/[0O1lI]/);
  }
});

test("requires a long enough new password typed twice", () => {
  expect(parsePasswordChange(form({ currentPassword: "ancien", newPassword: "court", confirmPassword: "court" })).success).toBe(false);
  expect(parsePasswordChange(form({ currentPassword: "ancien", newPassword: "un-mot-de-passe-long", confirmPassword: "different-long-pass" })).success).toBe(false);
  expect(parsePasswordChange(form({ currentPassword: "ancien", newPassword: "un-mot-de-passe-long", confirmPassword: "un-mot-de-passe-long" }))).toEqual({
    success: true,
    data: { currentPassword: "ancien", newPassword: "un-mot-de-passe-long" },
  });
});
