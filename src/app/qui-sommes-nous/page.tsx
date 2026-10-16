import { notFound } from "next/navigation";
import { ContentPage } from "@/components/content/content-page";
import { getPublicContentRepository } from "@/lib/content/public-repository";

export default async function AboutPage() {
  const publicContentRepository = getPublicContentRepository();
  const [page, documents] = await Promise.all([
    publicContentRepository.getPage("qui-sommes-nous"),
    publicContentRepository.getDocuments("institutional"),
  ]);

  if (!page) {
    notFound();
  }

  return <ContentPage page={page} documents={documents} />;
}
