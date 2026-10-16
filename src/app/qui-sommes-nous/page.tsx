import { notFound } from "next/navigation";
import { fixedPageMetadata } from "@/lib/content/fixed-page-metadata";
import { ContentPage } from "@/components/content/content-page";
import { getPublicContentRepository } from "@/lib/content/public-repository";

export function generateMetadata() {
  return fixedPageMetadata("qui-sommes-nous");
}

export default async function AboutPage() {
  const publicContentRepository = getPublicContentRepository();
  const [page, documents] = await Promise.all([
    publicContentRepository.getPage("qui-sommes-nous"),
    publicContentRepository.getDocuments("institutional"),
  ]);

  if (!page) {
    notFound();
  }

  return (
    <ContentPage
      page={page}
      documents={documents}
      eyebrow="L'association"
      visual={{
        src: "/images/janus-vatican.jpg",
        alt: "Buste en marbre de Janus aux deux visages opposés",
        caption: "Janus, musées du Vatican. Photo : Fubar Obfusco, domaine public (Wikimedia Commons).",
        width: 604,
        height: 530,
      }}
    />
  );
}
