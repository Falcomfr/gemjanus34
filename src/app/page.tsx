import { CurrentPlanning } from "@/components/home/current-planning";
import { TodayAtGem } from "@/components/planning/today-at-gem";
import { Hero } from "@/components/home/hero";
import { KeyFigures } from "@/components/home/key-figures";
import { Mission } from "@/components/home/mission";
import { QuickAccess } from "@/components/home/quick-access";
import { Quote } from "@/components/home/quote";
import { UpcomingNews } from "@/components/home/upcoming-news";
import { VisitPanel } from "@/components/home/visit-panel";
import { getPublicContentRepository } from "@/lib/content/public-repository";
import { selectLatestDocument } from "@/lib/content/select-latest-document";

export default async function HomePage() {
  const publicContentRepository = getPublicContentRepository();
  const [news, planningDocuments, planning] = await Promise.all([
    publicContentRepository.getNews(),
    publicContentRepository.getDocuments("planning"),
    publicContentRepository.getPlanning(),
  ]);
  const now = new Date().toISOString();

  return (
    <>
      <Hero />
      <QuickAccess />
      <KeyFigures />
      <Mission />
      <Quote />
      {planning?.slots.length ? (
        <TodayAtGem planning={planning} now={now} />
      ) : (
        <CurrentPlanning document={selectLatestDocument(planningDocuments)} />
      )}
      <UpcomingNews items={news} now={now} />
      <VisitPanel />
    </>
  );
}
