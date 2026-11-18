import { z } from "zod";
import type { Database } from "@/lib/database.types";
import { richContentSchema } from "@/lib/content/rich-content-schema";

// Routes and permanent redirects (next.config.ts) a stored page can never take over.
export const RESERVED_SLUGS = [
  "admin",
  "contact",
  "actualites",
  "documents",
  "images",
  "nous-contacter",
  "evenements",
  "nos-objectifs-2",
  "le-trouble-bipolaire-2",
  "janus",
  "samedi",
  "sortir-a-montpellier",
  "mentions-legales-et-confidentialite",
  "planning",
] as const;

// Site pages with their own route: their address must not change.
export const FIXED_PAGE_SLUGS = [
  "qui-sommes-nous",
  "activites",
  "nous-rejoindre",
  "ressources",
  "mentions-legales",
  "confidentialite",
] as const;

export const pageInputSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().max(500),
  content: richContentSchema,
  status: z.enum(["draft", "published", "archived"]),
  navigationPosition: z.number().int().min(0).nullable().default(null),
  parentId: z.uuid().nullable().default(null),
});

export type PageInput = z.infer<typeof pageInputSchema>;

export type PageField = keyof PageInput;

export type PageFormResult =
  | { success: true; data: PageInput }
  | { success: false; fieldErrors: Partial<Record<PageField, string[]>> };

const fieldMessages: Record<PageField, string> = {
  slug: "Utilisez uniquement des minuscules, des chiffres et des tirets.",
  title: "Le titre doit contenir entre 1 et 160 caractères.",
  summary: "Le résumé ne peut pas dépasser 500 caractères.",
  content: "Le contenu contient un élément non autorisé.",
  status: "Le statut de la page est invalide.",
  navigationPosition: "La position doit être un nombre entier positif.",
  parentId: "La page parente est invalide.",
};

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function parseContent(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export function parsePageFormData(formData: FormData): PageFormResult {
  const navigationPosition = stringValue(formData, "navigationPosition");
  const parentId = stringValue(formData, "parentId");
  const result = pageInputSchema.safeParse({
    slug: stringValue(formData, "slug"),
    title: stringValue(formData, "title"),
    summary: stringValue(formData, "summary"),
    content: parseContent(stringValue(formData, "content")),
    status: stringValue(formData, "status"),
    navigationPosition: navigationPosition === "" ? null : Number(navigationPosition),
    parentId: parentId === "" ? null : parentId,
  });

  if (result.success) {
    if ((RESERVED_SLUGS as readonly string[]).includes(result.data.slug)) {
      return {
        success: false,
        fieldErrors: { slug: ["Cette adresse est réservée par le site. Choisissez-en une autre."] },
      };
    }
    return result;
  }

  const flattened = z.flattenError(result.error).fieldErrors;
  const fieldErrors: Partial<Record<PageField, string[]>> = {};
  for (const field of Object.keys(flattened) as PageField[]) {
    fieldErrors[field] = [fieldMessages[field]];
  }

  return { success: false, fieldErrors };
}

type ExistingPageBoundary = Pick<
  Database["public"]["Tables"]["pages"]["Row"],
  "slug" | "status" | "navigation_position" | "parent_id"
>;

export function buildPageUpdate(
  role: Database["public"]["Enums"]["app_role"],
  input: PageInput,
  existing: ExistingPageBoundary,
) {
  return {
    title: input.title,
    summary: input.summary,
    content: input.content,
    slug: role === "admin" ? input.slug : existing.slug,
    navigation_position:
      role === "admin" ? input.navigationPosition : existing.navigation_position,
    parent_id: role === "admin" ? input.parentId : existing.parent_id,
    status: existing.status,
  };
}
