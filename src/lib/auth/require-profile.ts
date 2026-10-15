import { redirect } from "next/navigation";
import type { Database } from "@/lib/database.types";
import { createServerClient } from "@/lib/supabase/server";

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "display_name" | "role" | "notify_on_publish"
>;

type QueryResult = PromiseLike<{ data: ProfileRow | null; error: unknown }>;

export type ProfileClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string } | null };
      error: unknown;
    }>;
  };
  getActiveProfile: (userId: string) => QueryResult;
};

export type Profile = {
  id: string;
  displayName: string;
  role: Database["public"]["Enums"]["app_role"];
  notifyOnPublish: boolean;
};

async function getProfileClient(): Promise<ProfileClient> {
  const supabase = await createServerClient();

  return {
    auth: {
      getUser: async () => {
        const { data, error } = await supabase.auth.getUser();
        return { data: { user: data.user ? { id: data.user.id } : null }, error };
      },
    },
    getActiveProfile: async (userId) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, role, notify_on_publish")
        .eq("id", userId)
        .eq("active", true)
        .maybeSingle();

      return { data, error };
    },
  };
}

export async function requireProfile(client?: ProfileClient): Promise<Profile> {
  const profileClient = client ?? (await getProfileClient());
  const {
    data: { user },
  } = await profileClient.auth.getUser();

  if (!user) {
    redirect("/admin/connexion");
  }

  const { data: profile, error } = await profileClient.getActiveProfile(user.id);

  if (error || !profile) {
    throw new Error("Profil administrateur inactif ou introuvable.");
  }

  return {
    id: profile.id,
    displayName: profile.display_name,
    role: profile.role,
    notifyOnPublish: profile.notify_on_publish,
  };
}
