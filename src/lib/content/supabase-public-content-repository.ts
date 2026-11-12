import { createClient } from "@supabase/supabase-js";
import type { DocumentCategory, NewsItem, Planning, PlanningException, PlanningFamily, PlanningSlot, PublicDocument, PublicPage } from "@/content/types";
import type { Database } from "@/lib/database.types";
import { addDays, parisDate } from "@/lib/planning/week";
import { richContentSchema } from "./rich-content-schema";
import type { SupabaseConfig } from "@/lib/supabase/config";
import { publicContentRepository as localRepository } from "./local-public-content-repository";
import type { PublicContentRepository } from "./public-content-repository";

type PublicPageRow = Pick<
  Database["public"]["Tables"]["pages"]["Row"],
  "slug" | "title" | "summary" | "content"
> & { subPages?: Array<{ slug: string; title: string }> };

type PublicNewsRow = Pick<
  Database["public"]["Tables"]["news"]["Row"],
  "id" | "title" | "excerpt" | "starts_at" | "ends_at" | "featured" | "status" | "content"
>;

type PublicDocumentRow = Pick<
  Database["public"]["Tables"]["documents"]["Row"],
  "id" | "title" | "description" | "category" | "document_date" | "url"
>;

export type PlanningRows = {
  settings: { data: Array<{ effective_from: string; note: string }> | null; error: Error | null };
  days: { data: Array<{ day: number; opens_at: string | null; closes_at: string | null; team: string }> | null; error: Error | null };
  slots: {
    data: Array<{ id: string; day: number; starts_at: string; ends_at: string; title: string; leader: string; note: string; description: string; family: string; recurrence: string; month_weeks: number[] }> | null;
    error: Error | null;
  };
  exceptions: { data: PlanningExceptionRow[] | null; error: Error | null };
};

type PlanningExceptionRow = Pick<
  Database["public"]["Tables"]["planning_exceptions"]["Row"],
  "id" | "kind" | "date" | "end_date" | "slot_id" | "hidden" | "reason" | "starts_at" | "ends_at" | "title" | "leader" | "description" | "family"
>;

// The table's check constraints guarantee the fields each kind needs.
function mapPlanningException(row: PlanningExceptionRow): PlanningException {
  if (row.kind === "cancel") return { id: row.id, kind: "cancel", date: row.date, slotId: row.slot_id!, hidden: row.hidden, reason: row.reason };
  if (row.kind === "closure") return { id: row.id, kind: "closure", date: row.date, endDate: row.end_date!, reason: row.reason };
  return {
    id: row.id,
    kind: "extra",
    date: row.date,
    startsAt: hhmm(row.starts_at!),
    endsAt: hhmm(row.ends_at!),
    title: row.title!,
    leader: row.leader,
    description: row.description,
    family: row.family as PlanningFamily,
  };
}

type QueryResult<T> = Promise<{ data: T[] | null; error: Error | null }>;

export interface PublicContentQueryClient {
  getPublishedPages(slug?: string): QueryResult<PublicPageRow>;
  getPublishedNews(): QueryResult<PublicNewsRow>;
  getPublishedPageLinks(): QueryResult<{ slug: string; title: string; parentId: string | null }>;
  getPlanning(): Promise<PlanningRows>;
  getDocuments(category?: DocumentCategory): QueryResult<PublicDocumentRow>;
}

function parseRichContent(value: unknown) {
  const parsed = richContentSchema.safeParse(value);
  if (!parsed.success) throw new Error("Unsupported public page content", { cause: parsed.error });
  return parsed.data;
}

function mapPage(row: PublicPageRow): PublicPage {
  try {
    return {
      slug: row.slug,
      title: row.title,
      introduction: row.summary,
      sections: [],
      // Strict validation: unsupported content fails closed instead of rendering partially.
      content: parseRichContent(row.content),
      subPages: row.subPages ?? [],
    };
  } catch (error) {
    console.error(`Unsupported public page content for slug ${row.slug}`, error);
    throw error;
  }
}

function mapNews(row: PublicNewsRow): NewsItem {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    featured: row.featured,
    status: row.status,
    // Details are optional: an unreadable body hides the details, not the announcement.
    content: richContentSchema.safeParse(row.content).data,
  };
}

function mapDocument(row: PublicDocumentRow): PublicDocument {
  return {
    id: row.id,
    title: row.title,
    slug: row.id,
    description: row.description,
    // The database check constraint restricts category to DocumentCategory values.
    category: row.category as DocumentCategory,
    mimeType: "application/pdf",
    updatedAt: row.document_date,
    downloadUrl: row.url,
  };
}

// Postgres returns "14:00:00"; the site works with "14:00".
const hhmm = (time: string) => time.slice(0, 5);

export function mapPlanning(rows: PlanningRows): Planning | null {
  const settings = requireData(rows.settings)[0];
  if (!settings) return null;
  return {
    effectiveFrom: settings.effective_from,
    note: settings.note,
    days: requireData(rows.days)
      .map((day) => ({
        day: day.day,
        opensAt: day.opens_at ? hhmm(day.opens_at) : null,
        closesAt: day.closes_at ? hhmm(day.closes_at) : null,
        team: day.team,
      }))
      .toSorted((left, right) => left.day - right.day),
    slots: requireData(rows.slots)
      .map((slot) => ({
        id: slot.id,
        day: slot.day,
        startsAt: hhmm(slot.starts_at),
        endsAt: hhmm(slot.ends_at),
        title: slot.title,
        leader: slot.leader,
        note: slot.note,
        description: slot.description,
        // The database check constraint restricts family to PlanningFamily values.
        family: slot.family as PlanningFamily,
        recurrence: slot.recurrence as PlanningSlot["recurrence"],
        monthWeeks: slot.month_weeks,
      }))
      .toSorted((left, right) => left.day - right.day || left.startsAt.localeCompare(right.startsAt)),
    exceptions: requireData(rows.exceptions)
      .map(mapPlanningException)
      .toSorted((left, right) => left.date.localeCompare(right.date)),
  };
}

function requireData<T>(result: { data: T[] | null; error: Error | null }): T[] {
  if (result.error) throw result.error;
  return result.data ?? [];
}

export function createSupabasePublicContentRepository(
  client: PublicContentQueryClient,
): PublicContentRepository {
  return {
    async getSiteData() {
      const [pagesResult, newsResult, documentsResult] = await Promise.all([
        client.getPublishedPages(),
        client.getPublishedNews(),
        client.getDocuments(),
      ]);
      return {
        pages: requireData(pagesResult).map(mapPage),
        news: requireData(newsResult).map(mapNews),
        documents: requireData(documentsResult).map(mapDocument),
      };
    },

    async getPage(slug) {
      const rows = requireData(await client.getPublishedPages(slug));
      // Fixed public routes ship their own content; the database only overrides it.
      return rows[0] ? mapPage(rows[0]) : localRepository.getPage(slug);
    },

    async getPlanning() {
      return mapPlanning(await client.getPlanning());
    },

    async getPageLinks() {
      return requireData(await client.getPublishedPageLinks());
    },

    async getNews() {
      return requireData(await client.getPublishedNews()).map(mapNews);
    },

    async getDocuments(category) {
      return requireData(await client.getDocuments(category)).map(mapDocument);
    },
  };
}

export function createSupabasePublicQueryClient(
  config: SupabaseConfig,
): PublicContentQueryClient {
  const client = createClient<Database>(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    // Always fresh: the site renders per request (see app/layout.tsx).
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });

  return {
    async getPublishedPages(slug) {
      let query = client
        .from("pages")
        .select("slug, title, summary, content, subPages:pages!parent_id(slug, title)")
        .eq("status", "published")
        .eq("subPages.status", "published")
        .order("navigation_position", { ascending: true, nullsFirst: false })
        .order("navigation_position", { referencedTable: "subPages", ascending: true, nullsFirst: false });
      if (slug) query = query.eq("slug", slug);
      const result = await query;
      return { data: result.data, error: result.error };
    },

    async getDocuments(category) {
      let query = client
        .from("documents")
        .select("id, title, description, category, document_date, url")
        .order("document_date", { ascending: false });
      if (category) query = query.eq("category", category);
      const result = await query;
      return { data: result.data, error: result.error };
    },

    async getPlanning() {
      const [settings, days, slots, exceptions] = await Promise.all([
        client.from("planning_settings").select("effective_from, note").limit(1),
        client.from("planning_days").select("day, opens_at, closes_at, team"),
        client.from("planning_slots").select("id, day, starts_at, ends_at, title, leader, note, description, family, recurrence, month_weeks"),
        // A week shown today starts at most six days ago.
        client
          .from("planning_exceptions")
          .select("id, kind, date, end_date, slot_id, hidden, reason, starts_at, ends_at, title, leader, description, family")
          .gte("last_date", addDays(parisDate(new Date().toISOString()), -7)),
      ]);
      return {
        settings: { data: settings.data, error: settings.error },
        days: { data: days.data, error: days.error },
        slots: { data: slots.data, error: slots.error },
        exceptions: { data: exceptions.data, error: exceptions.error },
      };
    },

    async getPublishedPageLinks() {
      const result = await client
        .from("pages")
        .select("slug, title, parentId:parent_id")
        .eq("status", "published")
        .order("navigation_position", { ascending: true, nullsFirst: false });
      return { data: result.data, error: result.error };
    },

    async getPublishedNews() {
      const result = await client
        .from("news")
        .select("id, title, excerpt, starts_at, ends_at, featured, status, content")
        .eq("status", "published")
        .order("starts_at", { ascending: false });
      return { data: result.data, error: result.error };
    },
  };
}

export function createConfiguredPublicContentRepository(
  config: SupabaseConfig,
): PublicContentRepository {
  return createSupabasePublicContentRepository(createSupabasePublicQueryClient(config));
}
