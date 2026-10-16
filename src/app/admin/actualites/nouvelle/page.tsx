import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { NewsForm } from "@/components/admin/news-form";
import { requireProfile } from "@/lib/auth/require-profile";

export default async function NewAdminNewsPage() {
  const profile = await requireProfile();
  return (
    <div className="admin-page-editor">
      <Link className="admin-back-link" href="/admin/actualites"><ArrowLeft aria-hidden="true" size={18} />Actualités</Link>
      <header className="admin-page-header">
        <p className="eyebrow eyebrow--dark">Nouveau contenu</p>
        <h1>Créer une actualité</h1>
        <p>L’actualité sera enregistrée comme brouillon.</p>
      </header>
      <NewsForm mode="create" profile={profile} />
    </div>
  );
}
