import type { NewsItem } from "@/content/types";
import { isCurrentOrFuturePublicDate, publicDateTimestamp } from "@/lib/date/public-date";

const RECENT_DAYS = 60;

export type GroupedNews = { upcoming: NewsItem[]; recent: NewsItem[]; archived: NewsItem[] };

export function groupNews(items: ReadonlyArray<NewsItem>, now: string): GroupedNews {
  const recentSince = new Date(publicDateTimestamp(now) - RECENT_DAYS * 86_400_000).toISOString();
  const groups: GroupedNews = { upcoming: [], recent: [], archived: [] };

  for (const item of items) {
    if (item.status !== "published") continue;
    const end = item.endsAt ?? item.startsAt;
    if (isCurrentOrFuturePublicDate(end, now)) groups.upcoming.push(item);
    else if (isCurrentOrFuturePublicDate(end, recentSince)) groups.recent.push(item);
    else groups.archived.push(item);
  }

  const byStart = (left: NewsItem, right: NewsItem) =>
    publicDateTimestamp(left.startsAt) - publicDateTimestamp(right.startsAt);
  groups.upcoming.sort(byStart);
  groups.recent.sort((left, right) => byStart(right, left));
  groups.archived.sort((left, right) => byStart(right, left));
  return groups;
}
