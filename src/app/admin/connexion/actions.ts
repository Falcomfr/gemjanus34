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
  const { data, error } = await supabase.auth.signInWithPassword(credentials.data);

  if (error || !data.user) {
    return { error: genericLoginError };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .eq("active", true)
    .maybeSingle();
  if (!profile) {
    await supabase.auth.signOut({ scope: "local" });
    return { error: "Ce compte est désactivé. Contactez un administrateur de Janus34." };
  }

  redirect("/admin");
}

export async function logout(): Promise<never> {
  const supabase = await createServerClient();
  // "local" ends this browser session only; the default "global" would log out every device.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/admin/connexion");
}
