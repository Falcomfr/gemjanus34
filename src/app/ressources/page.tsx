import { Info } from "lucide-react";
import { notFound } from "next/navigation";
import { ContentPage } from "@/components/content/content-page";
import { getPublicContentRepository } from "@/lib/content/public-repository";

export default async function ResourcesPage() {
  const publicContentRepository = getPublicContentRepository();
  const [page, documents] = await Promise.all([
    publicContentRepository.getPage("ressources"),
    publicContentRepository.getDocuments("health"),
  ]);

  if (!page) {
    notFound();
  }

  return (
    <ContentPage page={page} documents={documents}>
      <aside className="health-notice" role="note">
        <Info aria-hidden="true" size={28} />
        <p>
          Ces informations ne remplacent pas l&apos;avis d&apos;un professionnel de santé. En cas
          d&apos;urgence, appelez le <a href="tel:15">15</a> ou le <a href="tel:112">112</a>. En cas
          de pensées suicidaires, le <a href="tel:3114">3114</a> répond jour et nuit, gratuitement.
        </p>
      </aside>
    </ContentPage>
  );
}
