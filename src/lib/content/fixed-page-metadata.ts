import type { Metadata } from "next";
import { getPublicPage } from "./public-page-loader";

export async function fixedPageMetadata(slug: string): Promise<Metadata> {
  const page = await getPublicPage(slug);
  return page ? { title: page.title, description: page.introduction } : {};
}
