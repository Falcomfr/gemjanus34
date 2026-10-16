import { FIXED_PAGE_SLUGS } from "@/lib/admin/page-input";
import { getPublicContentRepository } from "./public-repository";

export type ExtraPage = { slug: string; title: string };

// Published pages created in the admin, in their "Position" order. Never breaks the caller.
export async function getExtraPages(): Promise<ExtraPage[]> {
  try {
    const { pages } = await getPublicContentRepository().getSiteData();
    return pages
      .filter((page) => !(FIXED_PAGE_SLUGS as readonly string[]).includes(page.slug))
      .map(({ slug, title }) => ({ slug, title }));
  } catch (error) {
    console.error("Extra pages could not be loaded", error);
    return [];
  }
}
