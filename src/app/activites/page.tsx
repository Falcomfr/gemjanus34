import Link from "next/link";
import { notFound } from "next/navigation";
import { fixedPageMetadata } from "@/lib/content/fixed-page-metadata";
import { ContentPage } from "@/components/content/content-page";
import { getPublicContentRepository } from "@/lib/content/public-repository";
import { getSiteSettings } from "@/lib/settings/site-settings";

export function generateMetadata() {
  return fixedPageMetadata("activites");
}

export default async function ActivitiesPage() {
  const publicContentRepository = getPublicContentRepository();
  const [page, documents, settings] = await Promise.all([
    publicContentRepository.getPage("activites"),
    publicContentRepository.getDocuments("activity"),
    getSiteSettings(),
  ]);

  if (!page) {
    notFound();
  }

  return (
    <ContentPage
      page={page}
      documents={documents}
      eyebrow="La vie au GEM"
      visual={{
        src: "/images/peinture-gem.jpg",
        alt: "Peinture aux couleurs vives : un visage aux yeux clos, des oiseaux et des formes rouges, bleues et jaunes",
        caption: "Une peinture issue des archives de Janus34.",
        width: 1280,
        height: 960,
      }}
    >
      {settings.galleryEnabled ? (
        <p>
          <Link className="button button--dark" href="/galerie">Voir la galerie des créations</Link>
        </p>
      ) : null}
    </ContentPage>
  );
}
