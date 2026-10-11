import { notFound } from "next/navigation";
import { ContentPage } from "@/components/content/content-page";
import { publicContentRepository } from "@/lib/content/local-public-content-repository";

export default async function ActivitiesPage() {
  const page = await publicContentRepository.getPage("activites");

  if (!page) {
    notFound();
  }

  return <ContentPage page={page} />;
}
