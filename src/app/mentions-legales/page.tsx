import { notFound } from "next/navigation";
import { fixedPageMetadata } from "@/lib/content/fixed-page-metadata";
import { ContentPage } from "@/components/content/content-page";
import { getPublicContentRepository } from "@/lib/content/public-repository";

export function generateMetadata() {
  return fixedPageMetadata("mentions-legales");
}

export default async function LegalNoticePage() {
  const publicContentRepository = getPublicContentRepository();
  const page = await publicContentRepository.getPage("mentions-legales");

  if (!page) {
    notFound();
  }

  return <ContentPage page={page} />;
}
