"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateTemporaryPassword, parseAccountForm, type AccountField } from "@/lib/admin/account-input";
import { requireProfile } from "@/lib/auth/require-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export type AccountActionState = {
  success?: string;
  formError?: string;
  fieldErrors?: Partial<Record<AccountField, string[]>>;
  temporaryPassword?: string;
};

const notAdmin = { formError: "La gestion des comptes est réservée aux administrateurs." };
const selfGuard = { formError: "Vous ne pouvez pas retirer vos droits, désactiver ni supprimer votre propre compte." };
const lastAdminGuard = { formError: "Il doit rester au moins un administrateur actif." };

async function requireAdmin() {
  const profile = await requireProfile();
  return profile.role === "admin" ? profile : null;
}

const userIdSchema = z.uuid();

async function keepsAnActiveAdmin(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  next: { role: string; active: boolean } | null,
) {
  const { data: current } = await supabase.from("profiles").select("role, active").eq("id", userId).single();
  const losesAdmin = current?.role === "admin" && current.active && (!next || next.role !== "admin" || !next.active);
  if (!losesAdmin) return true;
  const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin").eq("active", true);
  return (count ?? 0) > 1;
}

export async function createAccount(_previous: AccountActionState, formData: FormData): Promise<AccountActionState> {
  if (!(await requireAdmin())) return notAdmin;
  const parsed = parseAccountForm(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  const { email, displayName, role, active } = parsed.data;
  const password = generateTemporaryPassword();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) {
    if (error && (error.code === "email_exists" || /already|exists/i.test(error.message))) {
      return { fieldErrors: { email: ["Un compte existe déjà avec cette adresse."] } };
    }
    return { formError: "Le compte n’a pas pu être créé." };
  }

  const supabase = await createServerClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: data.user.id, display_name: displayName, role, active, notify_on_publish: false });
  if (profileError) {
    // Never leave a login without its profile.
    await admin.auth.admin.deleteUser(data.user.id);
    return { formError: "Le compte n’a pas pu être créé." };
  }

  revalidatePath("/admin/comptes");
  return { success: `Compte créé pour ${displayName}. Transmettez-lui ce mot de passe provisoire :`, temporaryPassword: password };
}

export async function updateAccount(_previous: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const me = await requireAdmin();
  if (!me) return notAdmin;
  const userId = userIdSchema.safeParse(formData.get("userId"));
  if (!userId.success) return { formError: "Le compte demandé est invalide." };
  const parsed = parseAccountForm(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  const { displayName, role, active } = parsed.data;
  if (userId.data === me.id && (role !== "admin" || !active)) return selfGuard;

  const supabase = await createServerClient();
  if (!(await keepsAnActiveAdmin(supabase, userId.data, { role, active }))) return lastAdminGuard;

  const { error } = await supabase.from("profiles").update({ display_name: displayName, role, active }).eq("id", userId.data);
  if (error) return { formError: "Le compte n’a pas pu être modifié." };

  revalidatePath("/admin/comptes");
  return { success: "Compte modifié." };
}

export async function resetAccountPassword(_previous: AccountActionState, formData: FormData): Promise<AccountActionState> {
  if (!(await requireAdmin())) return notAdmin;
  const userId = userIdSchema.safeParse(formData.get("userId"));
  if (!userId.success) return { formError: "Le compte demandé est invalide." };

  const password = generateTemporaryPassword();
  const { error } = await createAdminClient().auth.admin.updateUserById(userId.data, { password });
  if (error) return { formError: "Le mot de passe n’a pas pu être réinitialisé." };

  return { success: "Nouveau mot de passe provisoire, à transmettre à la personne :", temporaryPassword: password };
}

export async function deleteAccount(_previous: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const me = await requireAdmin();
  if (!me) return notAdmin;
  const userId = userIdSchema.safeParse(formData.get("userId"));
  if (!userId.success) return { formError: "Le compte demandé est invalide." };
  if (userId.data === me.id) return selfGuard;

  const supabase = await createServerClient();
  if (!(await keepsAnActiveAdmin(supabase, userId.data, null))) return lastAdminGuard;

  const { error } = await createAdminClient().auth.admin.deleteUser(userId.data);
  if (error) {
    return /foreign key|violates/i.test(error.message)
      ? { formError: "Ce compte a créé des contenus : désactivez-le plutôt que de le supprimer." }
      : { formError: "Le compte n’a pas pu être supprimé." };
  }

  revalidatePath("/admin/comptes");
  return { success: "Compte supprimé." };
}
