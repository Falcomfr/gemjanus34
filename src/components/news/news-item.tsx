import type { JSX } from "react";
import { RichBlocks } from "@/components/content/rich-blocks";
import type { NewsItem as NewsItemData } from "@/content/types";
import { formatPublicDateRange } from "@/lib/date/public-date";
import { fr } from "@/lib/text/french";

type NewsItemProps = {
  item: NewsItemData;
};

export function NewsItem({ item }: NewsItemProps): JSX.Element {
  const details = item.content?.content.filter((block) => block.type !== "paragraph" || block.content?.length) ?? [];

  return (
    <article className="timeline-item">
      <p className="timeline-item__when">
        <time dateTime={item.startsAt}>{formatPublicDateRange(item.startsAt, item.endsAt)}</time>
        {item.featured ? <span className="news-card__status">À la une</span> : null}
      </p>
      <h3>{fr(item.title)}</h3>
      <div className="timeline-item__text">
        <p>{fr(item.excerpt)}</p>
        {details.length > 0 ? <RichBlocks blocks={details} /> : null}
      </div>
    </article>
  );
}
