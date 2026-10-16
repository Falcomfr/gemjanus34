import { publicContentRepository } from "../local-public-content-repository";
import { publicDateTimestamp } from "@/lib/date/public-date";

test("returns only published news in reverse chronological order", async () => {
  const news = await publicContentRepository.getNews();
  expect(news.length).toBeGreaterThan(0);
  expect(news.every((item) => item.status === "published")).toBe(true);
  const chronologicalKeys = news.map((item) => publicDateTimestamp(item.startsAt));
  expect(chronologicalKeys).toEqual(
    [...chronologicalKeys].sort((left, right) => right - left),
  );
});

test("returns documents filtered by category", async () => {
  const documents = await publicContentRepository.getDocuments("institutional");
  expect(documents.length).toBeGreaterThan(0);
  expect(documents.every((document) => document.category === "institutional")).toBe(true);
});

test("returns all public content from getSiteData", async () => {
  const siteData = await publicContentRepository.getSiteData();

  expect(siteData.pages.length).toBeGreaterThan(0);
  expect(siteData.news.length).toBeGreaterThan(0);
  expect(siteData.documents.length).toBeGreaterThan(0);
  expect(siteData.news.every((item) => item.status === "published")).toBe(true);
});

test("returns a page matching its slug", async () => {
  await expect(publicContentRepository.getPage("qui-sommes-nous")).resolves.toMatchObject({
    slug: "qui-sommes-nous",
    title: "Qui sommes-nous ?",
  });
});

test("returns null for an unknown page slug", async () => {
  await expect(publicContentRepository.getPage("page-inconnue")).resolves.toBeNull();
});

test("returns only news records with verified public dates", async () => {
  const news = await publicContentRepository.getNews();

  expect(news.map(({ title, startsAt }) => ({ title, startsAt }))).toEqual([
    { title: "Assemblée générale 2025", startsAt: "2025-05-10" },
  ]);
});

test("returns independent clones from every read method", async () => {
  const siteData = await publicContentRepository.getSiteData();
  const page = await publicContentRepository.getPage("qui-sommes-nous");
  const news = await publicContentRepository.getNews();
  const documents = await publicContentRepository.getDocuments();

  expect(page).not.toBeNull();
  expect(siteData.pages[0]).toBeDefined();
  expect(siteData.pages[0]?.sections[0]).toBeDefined();
  expect(siteData.news[0]).toBeDefined();
  expect(siteData.documents[0]).toBeDefined();
  expect(page?.sections[0]).toBeDefined();
  expect(news[0]).toBeDefined();
  expect(documents[0]).toBeDefined();

  siteData.pages[0]!.title = "Titre modifié";
  siteData.pages[0]!.sections[0]!.body = "Section modifiée";
  siteData.news[0]!.title = "Actualité modifiée";
  siteData.documents[0]!.title = "Document modifié";
  page!.sections[0]!.body = "Page modifiée";
  news[0]!.title = "Collection modifiée";
  documents[0]!.title = "Collection modifiée";

  const freshSiteData = await publicContentRepository.getSiteData();
  const freshPage = await publicContentRepository.getPage("qui-sommes-nous");
  const freshNews = await publicContentRepository.getNews();
  const freshDocuments = await publicContentRepository.getDocuments();

  expect(freshSiteData.pages[0]?.title).not.toBe("Titre modifié");
  expect(freshSiteData.pages[0]?.sections[0]?.body).not.toBe("Section modifiée");
  expect(freshSiteData.news[0]?.title).not.toBe("Actualité modifiée");
  expect(freshSiteData.documents[0]?.title).not.toBe("Document modifié");
  expect(freshPage?.sections[0]?.body).not.toBe("Page modifiée");
  expect(freshNews[0]?.title).not.toBe("Collection modifiée");
  expect(freshDocuments[0]?.title).not.toBe("Collection modifiée");
});
