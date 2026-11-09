import { randomInt } from "node:crypto";
import { z } from "zod";

export const MIN_PASSWORD_LENGTH = 10;

const accountSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  displayName: z.string().trim().min(2).max(100),
  role: z.enum(["admin", "manager", "editor"]),
  active: z.boolean(),
});

export type AccountInput = z.infer<typeof accountSchema>;
export type AccountField = keyof AccountInput;

const accountMessages: Record<AccountField, string> = {
  email: "Indiquez une adresse e-mail valide.",
  displayName: "Le nom doit contenir entre 2 et 100 caractères.",
  role: "Choisissez un rôle.",
  active: "Valeur invalide.",
};

export function parseAccountForm(
  formData: FormData,
): { success: true; data: AccountInput } | { success: false; fieldErrors: Partial<Record<AccountField, string[]>> } {
  const result = accountSchema.safeParse({
    email: formData.get("email") ?? "",
    displayName: formData.get("displayName") ?? "",
    role: formData.get("role") ?? "",
    active: formData.get("active") === "on",
  });
  if (result.success) return { success: true, data: result.data };
  const fieldErrors: Partial<Record<AccountField, string[]>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as AccountField;
    fieldErrors[field] = [accountMessages[field]];
  }
  return { success: false, fieldErrors };
}

// No look-alike characters (0/O, 1/l/I): the password is read aloud or copied by hand.
const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateTemporaryPassword(): string {
  const groups = Array.from({ length: 3 }, () =>
    Array.from({ length: 5 }, () => alphabet[randomInt(alphabet.length)]).join(""),
  );
  return groups.join("-");
}

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(MIN_PASSWORD_LENGTH).max(72),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, { path: ["confirmPassword"] });

const passwordMessages: Record<string, string> = {
  currentPassword: "Indiquez votre mot de passe actuel.",
  newPassword: `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`,
  confirmPassword: "Les deux mots de passe ne correspondent pas.",
};

export function parsePasswordChange(
  formData: FormData,
):
  | { success: true; data: { currentPassword: string; newPassword: string } }
  | { success: false; fieldErrors: Record<string, string[]> } {
  const result = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword") ?? "",
    newPassword: formData.get("newPassword") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });
  if (result.success) {
    return { success: true, data: { currentPassword: result.data.currentPassword, newPassword: result.data.newPassword } };
  }
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0]);
    fieldErrors[field] = [passwordMessages[field] ?? "Valeur invalide."];
  }
  return { success: false, fieldErrors };
}
