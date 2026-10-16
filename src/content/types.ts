export type ContentStatus = "draft" | "published" | "archived";
export type DocumentCategory = "planning" | "institutional" | "health" | "activity";

export type PublicDocument = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: DocumentCategory;
  mimeType: string;
  updatedAt: string;
  downloadUrl: string;
};

export type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  startsAt: string;
  endsAt: string | null;
  featured: boolean;
  status: ContentStatus;
};

export type PageLink = { label: string; href: string };

export type PageSection = {
  id: string;
  title: string;
  body: string;
  items?: string[];
  ordered?: boolean;
  links?: PageLink[];
};

export type PublicPage = {
  slug: string;
  title: string;
  eyebrow?: string;
  introduction: string;
  sections: PageSection[];
};

export type PublicSiteData = {
  pages: PublicPage[];
  news: NewsItem[];
  documents: PublicDocument[];
};
