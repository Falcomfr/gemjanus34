import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireProfile } from "@/lib/auth/require-profile";
import { ADMIN_PATHNAME_HEADER } from "@/lib/supabase/proxy";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = (await headers()).get(ADMIN_PATHNAME_HEADER);

  if (pathname === "/admin/connexion") {
    return (
      <div className="admin-area admin-area--login">
        <a className="skip-link" href="#admin-contenu">Aller au formulaire de connexion</a>
        {children}
      </div>
    );
  }

  const profile = await requireProfile();

  return (
    <div className="admin-area">
      <a className="skip-link" href="#admin-contenu">Aller au contenu d’administration</a>
      <AdminShell profile={profile}>{children}</AdminShell>
    </div>
  );
}
