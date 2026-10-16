import { CurrentPlanning } from "@/components/home/current-planning";
import { Hero } from "@/components/home/hero";
import { Mission } from "@/components/home/mission";
import { QuickAccess } from "@/components/home/quick-access";
import { UpcomingNews } from "@/components/home/upcoming-news";
import { VisitPanel } from "@/components/home/visit-panel";
import { getPublicContentRepository } from "@/lib/content/public-repository";
import { selectLatestDocument } from "@/lib/content/select-latest-document";

export const revalidate = 3600;

export default async function HomePage() {
  const publicContentRepository = getPublicContentRepository();
  const [news, planningDocuments] = await Promise.all([
    publicContentRepository.getNews(),
    publicContentRepository.getDocuments("planning"),
  ]);

  return (
    <>
      <Hero />
      <QuickAccess />
      <Mission />
      <CurrentPlanning document={selectLatestDocument(planningDocuments)} />
      <UpcomingNews items={news} now={new Date().toISOString()} />
      <VisitPanel />
    </>
  );
}
