import { cache } from "react";
import { FIXED_PAGE_SLUGS } from "@/lib/admin/page-input";
import { getPublicContentRepository } from "./public-repository";

// A page without a parent also goes in the main menu.
export type ExtraPage = { slug: string; title: string; parentId: string | null };

// Published pages created in the admin, in their "Position" order. Never breaks the caller.
export const getExtraPages = cache(async (): Promise<ExtraPage[]> => {
  try {
    const pages = await getPublicContentRepository().getPageLinks();
    return pages.filter((page) => !(FIXED_PAGE_SLUGS as readonly string[]).includes(page.slug));
  } catch (error) {
    console.error("Extra pages could not be loaded", error);
    return [];
  }
});
