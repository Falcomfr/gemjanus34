import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireProfile } from "@/lib/auth/require-profile";
import { ADMIN_PATHNAME_HEADER } from "@/lib/supabase/proxy";
import { createServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = (await headers()).get(ADMIN_PATHNAME_HEADER);

  if (pathname === "/admin/connexion") {
    const supabase = await createServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      // Only an active profile can use the admin; anyone else must be able to switch account.
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .eq("active", true)
        .maybeSingle();
      if (profile) redirect("/admin");
    }

    return (
      <div className="admin-area admin-area--login">
        <a className="skip-link" href="#admin-contenu">Aller au formulaire de connexion</a>
        {children}
      </div>
    );
  }

  const profile = await requireProfile();
  const supabase = await createServerClient();
  const head = { count: "exact" as const, head: true };
  const [messages, pages, news] = await Promise.all([
    supabase.from("contact_messages").select("id", head).is("handled_at", null),
    supabase.from("pages").select("id", head).eq("status", "draft"),
    supabase.from("news").select("id", head).eq("status", "draft"),
  ]);
  // An unreadable count shows no badge rather than breaking the admin.
  const pending = { messages: messages.count ?? 0, pages: pages.count ?? 0, news: news.count ?? 0 };

  return (
    <div className="admin-area">
      <a className="skip-link" href="#admin-contenu">Aller au contenu d’administration</a>
      <AdminShell pathname={pathname ?? "/admin"} profile={profile} pending={pending}>
        {children}
      </AdminShell>
    </div>
  );
}
