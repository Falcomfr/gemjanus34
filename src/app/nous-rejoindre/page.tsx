import { notFound } from "next/navigation";
import { fixedPageMetadata } from "@/lib/content/fixed-page-metadata";
import { ContentPage } from "@/components/content/content-page";
import { PracticalInfo } from "@/components/content/practical-info";
import { CallbackForm } from "@/components/contact/callback-form";
import { getPublicContentRepository } from "@/lib/content/public-repository";
import { getSiteSettings } from "@/lib/settings/site-settings";

export function generateMetadata() {
  return fixedPageMetadata("nous-rejoindre");
}

export default async function JoinPage() {
  const publicContentRepository = getPublicContentRepository();
  const [page, settings] = await Promise.all([publicContentRepository.getPage("nous-rejoindre"), getSiteSettings()]);

  if (!page) {
    notFound();
  }

  return (
    <ContentPage page={page} eyebrow="Première visite">
      <PracticalInfo />
      {settings.callbackEnabled ? <CallbackForm /> : null}
    </ContentPage>
  );
}
