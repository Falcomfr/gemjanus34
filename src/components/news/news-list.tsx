import type { JSX } from "react";
import type { NewsItem as NewsItemData } from "@/content/types";
import {
  isCurrentOrFuturePublicDate,
  publicDateTimestamp,
} from "@/lib/date/public-date";
import { NewsItem } from "./news-item";

type NewsListProps = {
  items: NewsItemData[];
  now: string;
};

export function NewsList({ items, now }: NewsListProps): JSX.Element {
  const published = items.filter((item) => item.status === "published");
  const upcoming = published
    .filter((item) => isCurrentOrFuturePublicDate(item.endsAt ?? item.startsAt, now))
    .toSorted(
      (left, right) => publicDateTimestamp(left.startsAt) - publicDateTimestamp(right.startsAt),
    );
  const archived = published
    .filter((item) => !isCurrentOrFuturePublicDate(item.endsAt ?? item.startsAt, now))
    .toSorted(
      (left, right) => publicDateTimestamp(right.startsAt) - publicDateTimestamp(left.startsAt),
    );

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
