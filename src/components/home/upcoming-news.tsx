import { CalendarDays } from "lucide-react";
import type { JSX } from "react";
import type { NewsItem } from "@/content/types";

type UpcomingNewsProps = {
  items: NewsItem[];
};

const frenchDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value: string): string {
  return frenchDateFormatter.format(new Date(`${value}T00:00:00Z`));
}

export function UpcomingNews({ items }: UpcomingNewsProps): JSX.Element {
  return (
    <section className="news-section" aria-labelledby="news-title">
      <div className="content-container">
        <div className="section-heading">
          <div>
            <p className="eyebrow eyebrow--dark">Actualités</p>
            <h2 id="news-title">Dernières actualités importées</h2>
          </div>
          <p>
            Ces archives relatent des événements passés. Elles seront complétées lors de la
            prochaine mise à jour éditoriale.
          </p>
        </div>

        {items.length > 0 ? (
          <div className="news-grid">
            {items.map((item) => (
              <article className="news-card" key={item.id}>
                <p className="news-card__date">
                  <CalendarDays aria-hidden="true" size={18} />
                  <time dateTime={item.startsAt}>{formatDate(item.startsAt)}</time>
                </p>
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
              </article>
            ))}
          </div>
        ) : (
          <p>Aucune actualité importée n&apos;est disponible pour le moment.</p>
        )}
      </div>
    </section>
  );
}
