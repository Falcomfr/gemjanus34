import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";
import type { NewsItem } from "@/content/types";
import { groupNews } from "@/lib/content/group-news";
import { formatPublicDate } from "@/lib/date/public-date";

type UpcomingNewsProps = {
  items: NewsItem[];
  now: string;
};

export function UpcomingNews({ items, now }: UpcomingNewsProps): JSX.Element {
  const { upcoming, recent } = groupNews(items, now);
  const shown = [
    ...upcoming.map((item) => ({ item, status: "À venir" })),
    ...recent.map((item) => ({ item, status: "Passé" })),
  ].slice(0, 3);

  return (
    <section className="news-section" aria-labelledby="news-title">
      <div className="content-container">
        <div className="section-heading">
          <div>
            <p className="eyebrow eyebrow--dark">Actualités</p>
            <h2 id="news-title">Les prochains rendez-vous</h2>
          </div>
          <Link className="text-link" href="/actualites">
            Toutes les actualités
            <ArrowRight aria-hidden="true" size={20} />
          </Link>
        </div>

        {shown.length > 0 ? (
          <div className="news-grid">
            {shown.map(({ item, status }) => (
              <article className="news-card" key={item.id}>
                <p className="news-card__date">
                  <CalendarDays aria-hidden="true" size={18} />
                  <time dateTime={item.startsAt}>{formatPublicDate(item.startsAt)}</time>
                  <span className="news-card__status">{status}</span>
                </p>
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="news-section__empty">Aucun rendez-vous n&apos;est annoncé pour le moment.</p>
        )}
      </div>
    </section>
  );
}
