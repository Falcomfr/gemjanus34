import type { JSX } from "react";
import type { NewsItem as NewsItemData } from "@/content/types";
import { NewsItem } from "./news-item";

type NewsListProps = {
  items: NewsItemData[];
  now: string;
};

function endTimestamp(item: NewsItemData): number {
  return Date.parse(item.endsAt ?? item.startsAt);
}

export function NewsList({ items, now }: NewsListProps): JSX.Element {
  const nowTimestamp = Date.parse(now);
  const published = items.filter((item) => item.status === "published");
  const upcoming = published
    .filter((item) => endTimestamp(item) >= nowTimestamp)
    .toSorted((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt));
  const archived = published
    .filter((item) => endTimestamp(item) < nowTimestamp)
    .toSorted((left, right) => Date.parse(right.startsAt) - Date.parse(left.startsAt));

  return (
    <div className="timeline content-container">
      <section className="timeline__section" aria-labelledby="upcoming-title">
        <div className="section-heading section-heading--compact">
          <div>
            <p className="eyebrow">Agenda</p>
            <h2 id="upcoming-title">À venir</h2>
          </div>
        </div>
        {upcoming.length > 0 ? (
          <div className="timeline__list">
            {upcoming.map((item) => (
              <NewsItem item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <p className="timeline__empty">
            Aucune annonce à venir n&apos;est publiée pour le moment.
          </p>
        )}
      </section>

      <section className="timeline__section" aria-labelledby="archives-title">
        <details className="timeline__archives">
          <summary>
            <span id="archives-title">Archives</span>
            <span aria-hidden="true">{archived.length}</span>
          </summary>
          {archived.length > 0 ? (
            <div className="timeline__list">
              {archived.map((item) => (
                <NewsItem item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <p className="timeline__empty">Aucune archive pour le moment.</p>
          )}
        </details>
      </section>
    </div>
  );
}
