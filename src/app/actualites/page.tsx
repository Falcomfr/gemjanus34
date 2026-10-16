import type { Metadata } from "next";
import { CurrentPlanning } from "@/components/home/current-planning";
import { NewsList } from "@/components/news/news-list";
import { getPublicContentRepository } from "@/lib/content/public-repository";
import { selectLatestDocument } from "@/lib/content/select-latest-document";

export const metadata: Metadata = {
  title: "Planning et actualités",
  description: "Le planning, les annonces et les archives publiques de Janus34.",
};

export const revalidate = 3600;

export default async function NewsPage() {
  const publicContentRepository = getPublicContentRepository();
  const [items, planningDocuments] = await Promise.all([
    publicContentRepository.getNews(),
    publicContentRepository.getDocuments("planning"),
  ]);

  return (
    <>
      <header className="content-page__header">
        <div className="content-container content-page__header-inner">
          <p className="eyebrow eyebrow--light">La vie du GEM</p>
          <h1>Planning et actualités</h1>
          <p>Retrouvez ici les informations publiées par Janus34 et leurs archives.</p>
        </div>
      </header>
      <CurrentPlanning document={selectLatestDocument(planningDocuments)} />
      <NewsList items={items} now={new Date().toISOString()} />
    </>
  );
}
