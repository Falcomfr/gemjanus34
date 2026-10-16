import { ArrowRight, ExternalLink, FileText, FolderOpen, Mail, Newspaper } from "lucide-react";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/require-profile";
import { createServerClient } from "@/lib/supabase/server";

type CountResult = { count: number | null; error: unknown };

// A failed count must not read as "nothing to do".
function countLabel(result: CountResult, label: (count: number) => string) {
  return result.error || result.count === null ? "nombre indisponible" : label(result.count);
}

export default async function AdminPage() {
  await requireProfile();
  const supabase = await createServerClient();
  const head = { count: "exact" as const, head: true };
  const [drafts, upcoming, documents, messages] = await Promise.all([
    supabase.from("pages").select("id", head).eq("status", "draft"),
    supabase.from("news").select("id", head).eq("status", "published").gte("starts_at", new Date().toISOString()),
    supabase.from("documents").select("id", head),
    supabase.from("contact_messages").select("id", head).is("handled_at", null),
  ]);

  const shortcuts = [
    { href: "/admin/pages", label: "Pages", detail: countLabel(drafts, (count) => `${count} ${count === 1 ? "brouillon" : "brouillons"}`), icon: FileText },
    { href: "/admin/actualites", label: "Actualités", detail: countLabel(upcoming, (count) => `${count} à venir`), icon: Newspaper },
    { href: "/admin/documents", label: "Documents", detail: countLabel(documents, (count) => `${count} en ligne`), icon: FolderOpen },
    { href: "/admin/messages", label: "Messages", detail: countLabel(messages, (count) => `${count} à traiter`), icon: Mail },
  ];

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <p className="eyebrow eyebrow--dark">Janus34</p>
        <h1>Tableau de bord</h1>
        <p>Gérez les pages, les actualités, les documents et les messages du site.</p>
      </header>
      <section aria-labelledby="admin-shortcuts-title">
        <h2 id="admin-shortcuts-title">Accès rapides</h2>
        <ul className="admin-summary-list">
          {shortcuts.map(({ href, label, detail, icon: Icon }) => (
            <li key={href}>
              <Link className="admin-summary" href={href}>
                <Icon aria-hidden="true" size={24} />
                <span>
                  <strong>{label}</strong>
                  <span>{detail}</span>
                </span>
                <ArrowRight aria-hidden="true" size={20} />
              </Link>
            </li>
          ))}
          <li>
            <a className="admin-summary" href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden="true" size={24} />
              <span>
                <strong>Voir le site</strong>
                <span>Le site public, dans un nouvel onglet</span>
              </span>
              <ArrowRight aria-hidden="true" size={20} />
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
