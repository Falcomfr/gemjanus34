import Link from "next/link";
import { DeleteGalleryItemButton, GalleryUploadForm } from "@/components/admin/gallery-forms";
import { requireProfile } from "@/lib/auth/require-profile";
import { getSiteSettings } from "@/lib/settings/site-settings";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminGalleryPage() {
  const profile = await requireProfile();
  const supabase = await createServerClient();
  const [{ data: items, error }, settings] = await Promise.all([
    supabase.from("gallery_items").select("id, title, author, workshop, image_url, created_at").order("created_at", { ascending: false }),
    getSiteSettings(),
  ]);

  return (
    <div className="admin-pages-index">
      <header className="admin-page-header">
        <p className="eyebrow eyebrow--dark">Contenu</p>
        <h1>Galerie</h1>
        <p>Les créations des ateliers, publiées avec l’accord de leurs auteurs.</p>
        {settings.galleryEnabled ? null : (
          <p className="admin-notice">
            La galerie n’est pas encore visible sur le site.{" "}
            {profile.role === "admin" ? <Link href="/admin/reglages">Activez-la dans Réglages</Link> : "Un administrateur l’activera dans Réglages"}{" "}
            une fois les œuvres choisies.
          </p>
        )}
      </header>

      <section className="admin-form-section" aria-labelledby="gallery-upload-title">
        <div className="admin-form-section__heading">
          <h2 id="gallery-upload-title">Ajouter une création</h2>
        </div>
        <GalleryUploadForm />
      </section>

      {error ? <p className="form-status form-status--error">Les créations n’ont pas pu être chargées.</p> : null}
      {!error && items?.length === 0 ? <p className="admin-empty-state">Aucune création pour le moment.</p> : null}
      {items && items.length > 0 ? (
        <ul className="admin-gallery__list">
          {items.map((item) => (
            <li key={item.id}>
              {/* eslint-disable-next-line @next/next/no-img-element -- photo from the public storage, already sized by the list */}
              <img src={item.image_url} alt={item.title} loading="lazy" />
              <div>
                <strong>{item.title}</strong>
                <span>{[item.author, item.workshop].filter(Boolean).join(" · ")}</span>
              </div>
              <DeleteGalleryItemButton id={item.id} title={item.title} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
