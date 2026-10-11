import { notFound } from "next/navigation";
import { ContentPage } from "@/components/content/content-page";
import { publicContentRepository } from "@/lib/content/local-public-content-repository";

export default async function AboutPage() {
  const [page, documents] = await Promise.all([
    publicContentRepository.getPage("qui-sommes-nous"),
    publicContentRepository.getDocuments("institutional"),
  ]);

  if (!page) {
    notFound();
  }

  return <ContentPage page={page} documents={documents} />;
}
