import type { Metadata } from "next";
import { CurrentPlanning } from "@/components/home/current-planning";
import { NewsList } from "@/components/news/news-list";
import { parisWeekday } from "@/components/planning/planning-format";
import { WeekPlanning } from "@/components/planning/week-planning";
import { getPublicContentRepository } from "@/lib/content/public-repository";
import { selectLatestDocument } from "@/lib/content/select-latest-document";

export const metadata: Metadata = {
  title: "Planning et actualités",
  description: "Le planning des activités, les prochains rendez-vous et les informations de Janus34.",
};

export const revalidate = 3600;

export default async function NewsPage() {
  const publicContentRepository = getPublicContentRepository();
  const [items, planningDocuments, planning] = await Promise.all([
    publicContentRepository.getNews(),
    publicContentRepository.getDocuments("planning"),
    publicContentRepository.getPlanning(),
  ]);
  const now = new Date().toISOString();

  return (
    <>
      <header className="content-page__header">
        <div className="content-container content-page__header-inner">
          <p className="eyebrow">La vie du GEM</p>
          <h1>Planning et actualités</h1>
          <p>
            Le planning de la semaine, les prochains rendez-vous et les dernières informations de
            Janus34.
          </p>
        </div>
      </header>
      {planning?.slots.length ? (
        <WeekPlanning planning={planning} today={parisWeekday(now)} />
      ) : (
        <CurrentPlanning document={selectLatestDocument(planningDocuments)} />
      )}
      <NewsList items={items} now={now} />
    </>
  );
}
