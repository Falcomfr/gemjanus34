import { notFound } from "next/navigation";
import { ContentPage } from "@/components/content/content-page";
import { publicContentRepository } from "@/lib/content/local-public-content-repository";

export default async function ResourcesPage() {
  const [page, documents] = await Promise.all([
    publicContentRepository.getPage("ressources"),
    publicContentRepository.getDocuments("health"),
  ]);

  if (!page) {
    notFound();
  }

  return <ContentPage page={page} documents={documents} />;
}
