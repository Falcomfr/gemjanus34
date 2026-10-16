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

  return <ContentPage page={page} documents={documents} />;
}
