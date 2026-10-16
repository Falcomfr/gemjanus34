import type { JSX } from "react";
import type { NewsItem as NewsItemData } from "@/content/types";
import { groupNews } from "@/lib/content/group-news";
import { NewsItem } from "./news-item";

type NewsListProps = {
  items: NewsItemData[];
  now: string;
};

function Timeline({ items, empty }: { items: NewsItemData[]; empty: string }): JSX.Element {
  return items.length > 0 ? (
    <div className="timeline__list">
      {items.map((item) => (
        <NewsItem item={item} key={item.id} />
      ))}
    </div>
  ) : (
    <p className="timeline__empty">{empty}</p>
  );
}

export function NewsList({ items, now }: NewsListProps): JSX.Element {
  const { upcoming, recent, archived } = groupNews(items, now);

  return (
    <div className="timeline content-container">
      <section className="timeline__section" aria-labelledby="upcoming-title">
        <p className="eyebrow eyebrow--dark">Agenda</p>
        <h2 id="upcoming-title">À venir</h2>
        <Timeline
          items={upcoming}
          empty="Aucun rendez-vous n'est annoncé pour le moment. Le planning ci-dessus présente les activités de chaque semaine."
        />
      </section>

      <section className="timeline__section" aria-labelledby="recent-title">
        <h2 id="recent-title">Informations récentes</h2>
        <Timeline items={recent} empty="Aucune information publiée ces deux derniers mois." />
      </section>

      {archived.length > 0 ? (
        <section className="timeline__section" aria-labelledby="archives-title">
          <details className="timeline__archives">
            <summary>
              <span id="archives-title">Archives</span>
              <span aria-hidden="true">{archived.length}</span>
            </summary>
            <Timeline items={archived} empty="" />
          </details>
        </section>
      ) : null}
    </div>
  );
}
