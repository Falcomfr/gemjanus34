import type { RichContent } from "@/lib/content/rich-content-schema";

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
  content?: RichContent;
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
  // Editor content of a page stored in Supabase; rendered instead of `sections` when present.
  content?: RichContent;
};

export type PublicSiteData = {
  pages: PublicPage[];
  news: NewsItem[];
  documents: PublicDocument[];
};

export type PlanningFamily = "creer" | "bouger" | "echanger";

export type PlanningDay = {
  day: number; // 1 = lundi … 6 = samedi
  opensAt: string | null; // "13:00"
  closesAt: string | null;
  team: string;
};

export type PlanningSlot = {
  id: string;
  day: number;
  startsAt: string;
  endsAt: string;
  title: string;
  leader: string;
  note: string;
  description: string;
  family: PlanningFamily;
  // Every week, only some weeks of the month, or every week but some (1 to 5, -1 = last).
  recurrence: "weekly" | "only" | "except";
  monthWeeks: number[];
};

// Dates are "YYYY-MM-DD" calendar days.
export type PlanningException =
  | { id: string; kind: "cancel"; date: string; slotId: string; hidden: boolean; reason: string }
  | { id: string; kind: "closure"; date: string; endDate: string; reason: string }
  | {
      id: string;
      kind: "extra";
      date: string;
      startsAt: string;
      endsAt: string;
      title: string;
      leader: string;
      description: string;
      family: PlanningFamily;
    };

export type Planning = {
  effectiveFrom: string;
  note: string;
  days: PlanningDay[];
  slots: PlanningSlot[];
  exceptions: PlanningException[];
};
