"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type LoginState = {
  error?: string;
};

const genericLoginError = "Adresse e-mail ou mot de passe incorrect.";

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const credentials = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!credentials.success) {
    return { error: genericLoginError };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword(credentials.data);

  if (error) {
    return { error: genericLoginError };
  }

  redirect("/admin");
}

export async function logout(): Promise<never> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/admin/connexion");
}
