import { notFound } from "next/navigation";
import { ContentPage } from "@/components/content/content-page";
import { PracticalInfo } from "@/components/content/practical-info";
import { getPublicContentRepository } from "@/lib/content/public-repository";

export default async function JoinPage() {
  const publicContentRepository = getPublicContentRepository();
  const page = await publicContentRepository.getPage("nous-rejoindre");

  if (!page) {
    notFound();
  }

  return (
    <ContentPage page={page}>
      <PracticalInfo />
    </ContentPage>
  );
}
