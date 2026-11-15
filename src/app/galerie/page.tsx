import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentPreview } from "@/components/content/document-preview";
import { getSiteSettings } from "@/lib/settings/site-settings";
import { createServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Galerie des créations",
  description: "Les créations et les écrits des ateliers de Janus34, publiés avec l'accord de leurs auteurs.",
};

type GalleryPageProps = { searchParams?: Promise<{ type?: string | string[]; atelier?: string | string[] }> };
type Filters = { type?: string; atelier?: string };

const types = [
  { value: undefined, label: "Tout" },
  { value: "oeuvres", label: "Œuvres" },
  { value: "ecrits", label: "Écrits" },
];

function filterHref({ type, atelier }: Filters): string {
  const query = new URLSearchParams();
  if (type) query.set("type", type);
  if (atelier) query.set("atelier", atelier);
  const search = query.toString();
  return search ? `/galerie?${search}` : "/galerie";
}

function FilterLink({ filters, current, children }: { filters: Filters; current: boolean; children: string }) {
  return (
    <li>
      <Link className="gallery-filters__link" href={filterHref(filters)} aria-current={current ? "page" : undefined}>
        {children}
      </Link>
    </li>
  );
}

export default async function GalleryPage({ searchParams }: GalleryPageProps = {}) {
  if (!(await getSiteSettings()).galleryEnabled) notFound();

  const params = (await searchParams) ?? {};
  const single = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);
  const type = types.some((option) => option.value && option.value === single(params.type)) ? single(params.type) : undefined;
  const atelier = single(params.atelier) || undefined;

  const supabase = await createServerClient();
  const { data } = await supabase
    .from("gallery_items")
    .select("id, kind, title, author, workshop, body, image_url")
    .order("created_at", { ascending: false });
  const items = data ?? [];
  // shortcut: filtered here on the whole list, fine for a few hundred creations; move to the query beyond that.
  const isWriting = (kind: string) => kind === "text" || kind === "pdf";
  const workshops = [...new Set(items.map((item) => item.workshop).filter((name): name is string => Boolean(name)))].sort((a, b) => a.localeCompare(b, "fr"));
  const shown = items.filter(
    (item) =>
      (!type || (type === "ecrits") === isWriting(item.kind)) && (!atelier || item.workshop === atelier),
  );
  const showTypes = items.some((item) => isWriting(item.kind)) && items.some((item) => !isWriting(item.kind));

  return (
    <article className="content-page">
      <header className="content-page__header">
        <div className="content-container content-page__header-inner">
          <div>
            <p className="eyebrow">La vie au GEM</p>
            <h1>Galerie des créations</h1>
            <p>Peintures, gravures, collages, poèmes et textes : des créations des ateliers, montrées avec l&apos;accord de leurs auteurs.</p>
          </div>
        </div>
      </header>
      <div className="content-container content-page__body">
        {showTypes || workshops.length > 1 ? (
          <nav className="gallery-filters" aria-label="Filtrer la galerie">
            {showTypes ? (
              <ul aria-label="Type de création">
                {types.map((option) => (
                  <FilterLink key={option.label} filters={{ type: option.value, atelier }} current={type === option.value}>
                    {option.label}
                  </FilterLink>
                ))}
              </ul>
            ) : null}
            {workshops.length > 1 ? (
              <ul aria-label="Atelier">
                <FilterLink filters={{ type }} current={!atelier}>Tous les ateliers</FilterLink>
                {workshops.map((name) => (
                  <FilterLink key={name} filters={{ type, atelier: name }} current={atelier === name}>
                    {name}
                  </FilterLink>
                ))}
              </ul>
            ) : null}
          </nav>
        ) : null}

        {shown.length > 0 ? (
          <ul className="gallery-grid">
            {shown.map((item) => {
              const credits = (
                <>
                  {item.author ? <span>par {item.author}</span> : null}
                  {item.workshop ? <span>{item.workshop}</span> : null}
                </>
              );
              if (isWriting(item.kind)) {
                return (
                  <li key={item.id} className="gallery-grid__writing">
                    <article className="gallery-writing" aria-labelledby={`creation-${item.id}`}>
                      <h2 id={`creation-${item.id}`}>{item.title}</h2>
                      {item.author || item.workshop ? <p className="gallery-writing__credits">{credits}</p> : null}
                      {item.kind === "text" ? (
                        <p className="gallery-writing__body">{item.body}</p>
                      ) : (
                        <DocumentPreview title={item.title} url={item.image_url ?? ""} />
                      )}
                    </article>
                  </li>
                );
              }
              return (
                <li key={item.id}>
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element -- photos from the public storage */}
                    <img src={item.image_url ?? ""} alt={item.title} loading="lazy" />
                    <figcaption>
                      <strong>{item.title}</strong>
                      {credits}
                    </figcaption>
                  </figure>
                </li>
              );
            })}
          </ul>
        ) : items.length > 0 ? (
          <p>
            Aucune création ne correspond à ce choix. <Link href="/galerie">Voir toute la galerie</Link>
          </p>
        ) : (
          <p>Les premières créations arrivent bientôt.</p>
        )}
      </div>
    </article>
  );
}
