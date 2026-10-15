import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageForm } from "@/components/admin/page-form";
import { requireProfile } from "@/lib/auth/require-profile";
import { createServerClient } from "@/lib/supabase/server";

export default async function EditAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const supabase = await createServerClient();
  const [{ data: page }, { data: revisions }, { data: parentOptions }] = await Promise.all([
    supabase
      .from("pages")
      .select("id, slug, title, summary, content, status, navigation_position, parent_id")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("page_revisions")
      .select("id, title, status, created_at")
      .eq("page_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("pages")
      .select("id, title")
      .neq("id", id)
      .neq("status", "archived")
      .order("title"),
  ]);

  if (!page) notFound();

  return (
    <div className="admin-page-editor">
      <Link className="admin-back-link" href="/admin/pages">
        <ArrowLeft aria-hidden="true" size={18} />
        Pages
      </Link>
      <header className="admin-page-header admin-page-header--actions">
        <div>
          <p className="eyebrow eyebrow--dark">Édition</p>
          <h1>{page.title}</h1>
          <p>/{page.slug}</p>
        </div>
        {page.status === "published" ? (
          <Link className="button button--light" href={`/${page.slug}`} target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" size={18} />
            Voir la page
          </Link>
        ) : null}
      </header>
      <PageForm
        mode="edit"
        profile={profile}
        page={page}
        parentOptions={parentOptions ?? []}
        revisions={revisions ?? []}
      />
    </div>
  );
}
