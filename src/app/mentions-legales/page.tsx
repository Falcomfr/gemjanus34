import { notFound } from "next/navigation";
import { ContentPage } from "@/components/content/content-page";
import { getPublicContentRepository } from "@/lib/content/public-repository";

export default async function LegalNoticePage() {
  const publicContentRepository = getPublicContentRepository();
  const page = await publicContentRepository.getPage("mentions-legales");

  if (!page) {
    notFound();
  }

  return <ContentPage page={page} />;
}
