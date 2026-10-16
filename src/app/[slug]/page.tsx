import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPage } from "@/components/content/content-page";
import { getPublicPage } from "@/lib/content/public-page-loader";

type DynamicPublicPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: DynamicPublicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicPage(slug);

  if (!page) return {};
  return { title: page.title, description: page.introduction };
}

export default async function DynamicPublicPage({ params }: DynamicPublicPageProps) {
  const { slug } = await params;
  const page = await getPublicPage(slug);

  if (!page) notFound();
  return <ContentPage page={page} />;
}
