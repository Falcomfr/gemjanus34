import { notFound } from "next/navigation";
import { fixedPageMetadata } from "@/lib/content/fixed-page-metadata";
import { ContentPage } from "@/components/content/content-page";
import { PracticalInfo } from "@/components/content/practical-info";
import { getPublicContentRepository } from "@/lib/content/public-repository";

export function generateMetadata() {
  return fixedPageMetadata("nous-rejoindre");
}

export default async function JoinPage() {
  const publicContentRepository = getPublicContentRepository();
  const page = await publicContentRepository.getPage("nous-rejoindre");

  if (!page) {
    notFound();
  }

  return (
    <ContentPage page={page} eyebrow="Première visite">
      <PracticalInfo />
    </ContentPage>
  );
}
