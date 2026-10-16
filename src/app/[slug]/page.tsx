import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPage } from "@/components/content/content-page";
import { getPublicContentRepository } from "@/lib/content/public-repository";

type DynamicPublicPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: DynamicPublicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const repository = getPublicContentRepository();
  const page = await repository.getPage(slug);

  if (!page) return {};
  return { title: page.title, description: page.introduction };
}

export default async function DynamicPublicPage({ params }: DynamicPublicPageProps) {
  const { slug } = await params;
  const repository = getPublicContentRepository();
  const page = await repository.getPage(slug);

  if (!page) notFound();
  return <ContentPage page={page} />;
}
