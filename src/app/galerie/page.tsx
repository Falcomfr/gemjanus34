import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteSettings } from "@/lib/settings/site-settings";
import { createServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Galerie des créations",
  description: "Les créations des ateliers de Janus34, publiées avec l'accord de leurs auteurs.",
};

export default async function GalleryPage() {
  if (!(await getSiteSettings()).galleryEnabled) notFound();

  const supabase = await createServerClient();
  const { data: items } = await supabase
    .from("gallery_items")
    .select("id, title, author, workshop, image_url")
    .order("created_at", { ascending: false });

  return (
    <article className="content-page">
      <header className="content-page__header">
        <div className="content-container content-page__header-inner">
          <div>
            <p className="eyebrow">La vie au GEM</p>
            <h1>Galerie des créations</h1>
            <p>Peintures, gravures, collages : des créations des ateliers, montrées avec l&apos;accord de leurs auteurs.</p>
          </div>
        </div>
      </header>
      <div className="content-container content-page__body">
        {items && items.length > 0 ? (
          <ul className="gallery-grid">
            {items.map((item) => (
              <li key={item.id}>
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element -- photos from the public storage */}
                  <img src={item.image_url} alt={item.title} loading="lazy" />
                  <figcaption>
                    <strong>{item.title}</strong>
                    {item.author ? <span>par {item.author}</span> : null}
                    {item.workshop ? <span>{item.workshop}</span> : null}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        ) : (
          <p>Les premières créations arrivent bientôt.</p>
        )}
      </div>
    </article>
  );
}
