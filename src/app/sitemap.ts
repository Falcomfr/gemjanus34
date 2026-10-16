import type { MetadataRoute } from "next";
import { getExtraPages } from "@/lib/content/extra-pages";

const baseUrl = "https://gemjanus34.fr";

const publicRoutes = [
  "",
  "/qui-sommes-nous",
  "/activites",
  "/actualites",
  "/nous-rejoindre",
  "/ressources",
  "/contact",
  "/mentions-legales",
  "/confidentialite",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const extraRoutes = (await getExtraPages()).map((page) => `/${page.slug}`);

  return [...publicRoutes, ...extraRoutes].map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "/actualites" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
