import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/require-profile";
import { createServerClient } from "@/lib/supabase/server";

const statusLabels = {
  draft: "Brouillon",
  published: "Publiée",
  archived: "Archivée",
} as const;

export default async function AdminPagesPage() {
  await requireProfile();
  const supabase = await createServerClient();
  const { data: pages, error } = await supabase
    .from("pages")
    .select("id, slug, title, status, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="admin-pages-index">
      <header className="admin-page-header admin-page-header--actions">
        <div>
          <p className="eyebrow eyebrow--dark">Contenu</p>
          <h1>Pages</h1>
          <p>Préparez, organisez et publiez les pages du site.</p>
        </div>
        <Link className="button button--dark" href="/admin/pages/nouveau">
          <Plus aria-hidden="true" size={18} />
          Nouvelle page
        </Link>
      </header>

      {error ? <p className="form-status form-status--error">Les pages n’ont pas pu être chargées.</p> : null}
      {!error && pages?.length === 0 ? (
        <p className="admin-empty-state">Aucune page pour le moment.</p>
      ) : null}
      {pages && pages.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Page</th>
                <th scope="col">Statut</th>
                <th scope="col">Mise à jour</th>
                <th scope="col"><span className="sr-only">Ouvrir</span></th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id}>
                  <td>
                    <Link href={`/admin/pages/${page.id}`}><strong>{page.title}</strong></Link>
                    <span>/{page.slug}</span>
                  </td>
                  <td><span className={`status-badge status-badge--${page.status}`}>{statusLabels[page.status]}</span></td>
                  <td><time dateTime={page.updated_at}>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(page.updated_at))}</time></td>
                  <td>
                    <Link href={`/admin/pages/${page.id}`} aria-label={`Ouvrir ${page.title}`} title="Ouvrir la page">
                      <ArrowRight aria-hidden="true" size={20} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
