import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { CurrentPlanning } from "@/components/home/current-planning";
import { NewsList } from "@/components/news/news-list";
import { WeekPlanning } from "@/components/planning/week-planning";
import { getPublicContentRepository } from "@/lib/content/public-repository";
import { getSiteSettings } from "@/lib/settings/site-settings";
import { selectLatestDocument } from "@/lib/content/select-latest-document";
import { parisDate, resolveWeek } from "@/lib/planning/week";

export const metadata: Metadata = {
  title: "Planning et actualités",
  description: "Le planning des activités, les prochains rendez-vous et les informations de Janus34.",
};

type NewsPageProps = { searchParams?: Promise<{ semaine?: string | string[] }> };

export default async function NewsPage({ searchParams }: NewsPageProps = {}) {
  const publicContentRepository = getPublicContentRepository();
  const [items, planningDocuments, planning, settings] = await Promise.all([
    publicContentRepository.getNews(),
    publicContentRepository.getDocuments("planning"),
    publicContentRepository.getPlanning(),
    getSiteSettings(),
  ]);
  const now = new Date().toISOString();
  const requested = (await searchParams)?.semaine;
  const { monday, ...navigation } = resolveWeek(typeof requested === "string" ? requested : undefined, now);

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
          <p>
            <Link className="text-link" href="/lettre">Lire ou imprimer la lettre de la semaine</Link>
            {settings.conferencesEnabled ? (
              <>
                {" · "}
                <Link className="text-link" href="/conferences">Le programme des conférences</Link>
              </>
            ) : null}
          </p>
        </div>
      </header>
      {planning?.slots.length ? (
        <WeekPlanning planning={planning} monday={monday} today={parisDate(now)} navigation={navigation} calendarHost={(await headers()).get("host") ?? undefined} />
      ) : (
        <CurrentPlanning document={selectLatestDocument(planningDocuments)} />
      )}
      <NewsList items={items} now={now} />
    </>
  );
}
