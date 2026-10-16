import type {
  DocumentCategory,
  NewsItem,
  Planning,
  PublicDocument,
  PublicPage,
  PublicSiteData,
} from "@/content/types";

export interface PublicContentRepository {
  getSiteData(): Promise<PublicSiteData>;
  getPage(slug: string): Promise<PublicPage | null>;
  getPageLinks(): Promise<Array<{ slug: string; title: string }>>;
  getNews(): Promise<NewsItem[]>;
  getPlanning(): Promise<Planning | null>;
  getDocuments(category?: DocumentCategory): Promise<PublicDocument[]>;
}
