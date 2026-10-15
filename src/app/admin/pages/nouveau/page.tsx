import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageForm } from "@/components/admin/page-form";
import { requireProfile } from "@/lib/auth/require-profile";
import { createServerClient } from "@/lib/supabase/server";

export default async function NewAdminPage() {
  const profile = await requireProfile();
  const supabase = await createServerClient();
  const { data: parentOptions, error: parentOptionsError } = await supabase
    .from("pages")
    .select("id, title")
    .neq("status", "archived")
    .order("title");

  return (
    <div className="admin-page-editor">
      <Link className="admin-back-link" href="/admin/pages">
        <ArrowLeft aria-hidden="true" size={18} />
        Pages
      </Link>
      <header className="admin-page-header">
        <p className="eyebrow eyebrow--dark">Nouveau contenu</p>
        <h1>Créer une page</h1>
        <p>La page sera enregistrée comme brouillon.</p>
      </header>
      <PageForm
        mode="create"
        profile={profile}
        parentOptions={parentOptions ?? []}
        parentOptionsError={Boolean(parentOptionsError)}
      />
    </div>
  );
}
