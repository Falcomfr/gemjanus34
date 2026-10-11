import type { JSX } from "react";
import type { NewsItem as NewsItemData } from "@/content/types";
import { formatPublicDate } from "@/lib/date/public-date";

type NewsItemProps = {
  item: NewsItemData;
};

export function NewsItem({ item }: NewsItemProps): JSX.Element {
  return (
    <article className="timeline-item">
      <time dateTime={item.startsAt}>{formatPublicDate(item.startsAt)}</time>
      <h3>{item.title}</h3>
      <p>{item.excerpt}</p>
    </article>
  );
}
