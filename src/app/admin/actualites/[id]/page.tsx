import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NewsForm } from "@/components/admin/news-form";
import { requireProfile } from "@/lib/auth/require-profile";
import { createServerClient } from "@/lib/supabase/server";

export default async function EditAdminNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: news, error } = await supabase
    .from("news")
    .select("id, title, excerpt, content, starts_at, ends_at, featured, status")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("L’actualité n’a pas pu être chargée.");
  if (!news) notFound();

  return (
    <div className="admin-page-editor">
      <Link className="admin-back-link" href="/admin/actualites"><ArrowLeft aria-hidden="true" size={18} />Actualités</Link>
      <header className="admin-page-header admin-page-header--actions">
        <div><p className="eyebrow eyebrow--dark">Édition</p><h1>{news.title}</h1><p>{news.status === "published" ? "Actualité publiée" : news.status === "archived" ? "Actualité archivée" : "Brouillon"}</p></div>
        {news.status === "published" ? <Link className="button button--light" href="/actualites" target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" size={18} />Voir les actualités</Link> : null}
      </header>
      <NewsForm mode="edit" profile={profile} news={news} />
    </div>
  );
}
