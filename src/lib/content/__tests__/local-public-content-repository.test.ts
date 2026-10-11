import { publicContentRepository } from "../local-public-content-repository";

test("returns only published news in reverse chronological order", async () => {
  const news = await publicContentRepository.getNews();
  expect(news.length).toBeGreaterThan(0);
  expect(news.every((item) => item.status === "published")).toBe(true);
  expect(news.map((item) => item.startsAt)).toEqual(
    [...news.map((item) => item.startsAt)].sort().reverse(),
  );
});

test("returns documents filtered by category", async () => {
  const documents = await publicContentRepository.getDocuments("institutional");
  expect(documents.length).toBeGreaterThan(0);
  expect(documents.every((document) => document.category === "institutional")).toBe(true);
});
