import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/require-profile";
import { createServerClient } from "@/lib/supabase/server";

const statusLabels = { draft: "Brouillon", published: "Publiée", archived: "Archivée" } as const;

export default async function AdminNewsPage() {
  await requireProfile();
  const supabase = await createServerClient();
  const { data: items, error } = await supabase
    .from("news")
    .select("id, title, status, starts_at, updated_at, author:profiles!news_created_by_fkey(display_name)")
    .order("starts_at", { ascending: false });

  return (
    <div className="admin-pages-index">
      <header className="admin-page-header admin-page-header--actions">
        <div>
          <p className="eyebrow eyebrow--dark">Contenu</p>
          <h1>Actualités</h1>
          <p>Préparez les annonces, leurs dates et leur publication.</p>
        </div>
        <Link className="button button--dark" href="/admin/actualites/nouvelle">
          <Plus aria-hidden="true" size={18} />
          Nouvelle actualité
        </Link>
      </header>

      {error ? <p className="form-status form-status--error">Les actualités n’ont pas pu être chargées.</p> : null}
      {!error && items?.length === 0 ? <p className="admin-empty-state">Aucune actualité pour le moment.</p> : null}
      {items && items.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th scope="col">Actualité</th><th scope="col">Statut</th><th scope="col">Début</th><th scope="col">Auteur</th><th scope="col"><span className="sr-only">Ouvrir</span></th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.title}</strong><span>Modifiée le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(item.updated_at))}</span></td>
                  <td><span className={`status-badge status-badge--${item.status}`}>{statusLabels[item.status]}</span></td>
                  <td><time dateTime={item.starts_at}>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(item.starts_at))}</time></td>
                  <td>{item.author?.display_name ?? "Compte inconnu"}</td>
                  <td><Link href={`/admin/actualites/${item.id}`} aria-label={`Ouvrir ${item.title}`} title="Ouvrir l’actualité"><ArrowRight aria-hidden="true" size={20} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
