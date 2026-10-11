import type { JSX } from "react";
import type { NewsItem as NewsItemData } from "@/content/types";

const frenchDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "Europe/Paris",
});

type NewsItemProps = {
  item: NewsItemData;
};

export function NewsItem({ item }: NewsItemProps): JSX.Element {
  return (
    <article className="timeline-item">
      <time dateTime={item.startsAt}>{frenchDate.format(new Date(item.startsAt))}</time>
      <h3>{item.title}</h3>
      <p>{item.excerpt}</p>
    </article>
  );
}
