import { createClient } from "@supabase/supabase-js";
import type { DocumentCategory, NewsItem, PublicDocument, PublicPage } from "@/content/types";
import type { Database, Json } from "@/lib/database.types";
import type { SupabaseConfig } from "@/lib/supabase/config";
import { publicContentRepository as localRepository } from "./local-public-content-repository";
import type { PublicContentRepository } from "./public-content-repository";

type PublicPageRow = Pick<
  Database["public"]["Tables"]["pages"]["Row"],
  "slug" | "title" | "summary" | "content"
>;

type PublicNewsRow = Pick<
  Database["public"]["Tables"]["news"]["Row"],
  "id" | "title" | "excerpt" | "starts_at" | "ends_at" | "featured" | "status"
>;

type PublicDocumentRow = Pick<
  Database["public"]["Tables"]["documents"]["Row"],
  "id" | "title" | "description" | "category" | "document_date" | "url"
>;

type QueryResult<T> = Promise<{ data: T[] | null; error: Error | null }>;

export interface PublicContentQueryClient {
  getPublishedPages(slug?: string): QueryResult<PublicPageRow>;
  getPublishedNews(): QueryResult<PublicNewsRow>;
  getDocuments(category?: DocumentCategory): QueryResult<PublicDocumentRow>;
}

type RichNode = {
  type?: unknown;
  text?: unknown;
  attrs?: { level?: unknown };
  content?: unknown;
};

function textContent(node: RichNode): string {
  if (!Array.isArray(node.content)) return "";
  return node.content.map((child: RichNode) => {
    if (child.type === "hardBreak") return " ";
    if (child.type !== "text" || typeof child.text !== "string") {
      throw new Error("Unsupported public page content");
    }
    return child.text;
  }).join("");
}

// Public sections hold one flat list: nested list items follow their parent item.
function listItems(list: RichNode): string[] {
  if (!Array.isArray(list.content) || list.content.length === 0) {
    throw new Error("Unsupported public page content");
  }
  return list.content.flatMap((item: RichNode) => {
    if (item.type !== "listItem" || !Array.isArray(item.content)) {
      throw new Error("Unsupported public page content");
    }
    const text: string[] = [];
    const nested: string[] = [];
    for (const child of item.content as RichNode[]) {
      if (child.type === "paragraph") text.push(textContent(child));
      else if (child.type === "bulletList" || child.type === "orderedList") nested.push(...listItems(child));
      else throw new Error("Unsupported public page content");
    }
    return [text.join(" "), ...nested].filter(Boolean);
  });
}

function sectionId(title: string, index: number): string {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || `section-${index + 1}`;
}

function richContentToSections(content: Json): PublicPage["sections"] {
  if (!content || Array.isArray(content) || typeof content !== "object") {
    throw new Error("Unsupported public page content");
  }

  const doc = content as RichNode;
  if (doc.type !== "doc" || !Array.isArray(doc.content)) {
    throw new Error("Unsupported public page content");
  }

  const sections: PublicPage["sections"] = [];
  const usedIds = new Set<string>();
  let current: PublicPage["sections"][number] | undefined;

  const nextSectionId = (title: string) => {
    const base = sectionId(title, sections.length);
    let candidate = base;
    let suffix = 2;

    while (usedIds.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    usedIds.add(candidate);
    return candidate;
  };

  for (const node of doc.content as RichNode[]) {
    if (node.type === "heading" && (node.attrs?.level === 2 || node.attrs?.level === 3)) {
      const title = textContent(node);
      current = { id: nextSectionId(title), title, body: "" };
      sections.push(current);
      continue;
    }

    if (node.type === "paragraph" || node.type === "bulletList" || node.type === "orderedList") {
      if (!current) {
        current = { id: nextSectionId("Contenu"), title: "Contenu", body: "" };
        sections.push(current);
      }
      if (node.type === "paragraph") {
        current.body = [current.body, textContent(node)].filter(Boolean).join("\n\n");
      } else {
        if (!current.items && node.type === "orderedList") current.ordered = true;
        current.items = [...(current.items ?? []), ...listItems(node)];
      }
      continue;
    }

    throw new Error("Unsupported public page content");
  }

  return sections;
}

function mapPage(row: PublicPageRow): PublicPage {
  try {
    return {
      slug: row.slug,
      title: row.title,
      introduction: row.summary,
      sections: richContentToSections(row.content),
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
  });

  return {
    async getPublishedPages(slug) {
      let query = client
        .from("pages")
        .select("slug, title, summary, content")
        .eq("status", "published")
        .order("navigation_position", { ascending: true, nullsFirst: false });
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

    async getPublishedNews() {
      const result = await client
        .from("news")
        .select("id, title, excerpt, starts_at, ends_at, featured, status")
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
