import type {
  DocumentCategory,
  NewsItem,
  PublicDocument,
  PublicPage,
  PublicSiteData,
} from "@/content/types";

export interface PublicContentRepository {
  getSiteData(): Promise<PublicSiteData>;
  getPage(slug: string): Promise<PublicPage | null>;
  getNews(): Promise<NewsItem[]>;
  getDocuments(category?: DocumentCategory): Promise<PublicDocument[]>;
}
