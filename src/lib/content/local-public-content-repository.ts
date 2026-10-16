import { bundledPlanning } from "@/content/planning";
import { newsItems, publicDocuments, publicPages } from "@/content/seed";
import type {
  DocumentCategory,
  NewsItem,
  PublicDocument,
  PublicPage,
  PublicSiteData,
} from "@/content/types";
import type { PublicContentRepository } from "@/lib/content/public-content-repository";
import { publicDateTimestamp } from "@/lib/date/public-date";

function clonePage(page: PublicPage): PublicPage {
  return {
    ...page,
    sections: page.sections.map((section) => ({
      ...section,
      ...(section.items ? { items: [...section.items] } : {}),
      ...(section.links ? { links: section.links.map((link) => ({ ...link })) } : {}),
    })),
  };
}

function cloneNewsItem(item: NewsItem): NewsItem {
  return { ...item };
}

function cloneDocument(document: PublicDocument): PublicDocument {
  publicDateTimestamp(document.updatedAt);
  return { ...document };
}

function getPublishedNews(): NewsItem[] {
  return newsItems
    .filter((item) => item.status === "published")
    .toSorted(
      (left, right) => publicDateTimestamp(right.startsAt) - publicDateTimestamp(left.startsAt),
    )
    .map(cloneNewsItem);
}

function getPublicDocuments(category?: DocumentCategory): PublicDocument[] {
  return publicDocuments
    .filter((document) => category === undefined || document.category === category)
    .map(cloneDocument);
}

export const publicContentRepository: PublicContentRepository = {
  async getSiteData(): Promise<PublicSiteData> {
    return {
      pages: publicPages.map(clonePage),
      news: getPublishedNews(),
      documents: getPublicDocuments(),
    };
  },

  async getPage(slug: string): Promise<PublicPage | null> {
    const page = publicPages.find((candidate) => candidate.slug === slug);
    return page ? clonePage(page) : null;
  },

  async getPageLinks() {
    return publicPages.map(({ slug, title }) => ({ slug, title }));
  },

  async getPlanning() {
    return structuredClone(bundledPlanning);
  },

  async getNews(): Promise<NewsItem[]> {
    return getPublishedNews();
  },

  async getDocuments(category?: DocumentCategory): Promise<PublicDocument[]> {
    return getPublicDocuments(category);
  },
};
