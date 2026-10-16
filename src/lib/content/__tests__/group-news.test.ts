import type { NewsItem } from "@/content/types";
import { groupNews } from "../group-news";

function news(id: string, startsAt: string, extra: Partial<NewsItem> = {}): NewsItem {
  return { id, title: id, excerpt: id, startsAt, endsAt: null, featured: false, status: "published", ...extra };
}

const now = "2026-10-16T10:00:00+02:00";

test("keeps announcements of the current Paris day upcoming", () => {
  expect(groupNews([news("today", "2026-10-16")], now).upcoming.map((item) => item.id)).toEqual(["today"]);
});

test("treats news ended within 60 days as recent and older ones as archives", () => {
  const groups = groupNews([news("59-days", "2026-08-18"), news("61-days", "2026-08-16")], now);

  expect(groups.recent.map((item) => item.id)).toEqual(["59-days"]);
  expect(groups.archived.map((item) => item.id)).toEqual(["61-days"]);
});

test("uses the end date to decide whether an event is still upcoming", () => {
  const groups = groupNews([news("expo", "2026-09-01", { endsAt: "2026-11-01" })], now);

  expect(groups.upcoming.map((item) => item.id)).toEqual(["expo"]);
});

test("sorts upcoming soonest first and past news latest first, published only", () => {
  const groups = groupNews(
    [
      news("later", "2026-12-01"),
      news("sooner", "2026-10-20"),
      news("draft", "2026-10-18", { status: "draft" }),
      news("old", "2026-09-01"),
      news("older", "2026-09-10"),
    ],
    now,
  );

  expect(groups.upcoming.map((item) => item.id)).toEqual(["sooner", "later"]);
  expect(groups.recent.map((item) => item.id)).toEqual(["older", "old"]);
});

test("classifies Supabase timestamps ended last week as recent", () => {
  const groups = groupNews(
    [
      news("fabre", "2026-10-08T08:00:00+00:00", { endsAt: "2026-10-08T11:00:00+00:00" }),
      news("parole", "2026-10-06T14:00:00+00:00"),
    ],
    "2026-10-16T12:41:23.456Z",
  );

  expect(groups.recent.map((item) => item.id)).toEqual(["fabre", "parole"]);
});
