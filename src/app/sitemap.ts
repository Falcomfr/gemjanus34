import type { MetadataRoute } from "next";
import { getExtraPages } from "@/lib/content/extra-pages";
import { getSiteSettings } from "@/lib/settings/site-settings";

const baseUrl = "https://gemjanus34.fr";

const publicRoutes = [
  "",
  "/qui-sommes-nous",
  "/activites",
  "/actualites",
  "/planning",
  "/nous-rejoindre",
  "/ressources",
  "/contact",
  "/mentions-legales",
  "/confidentialite",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, settings] = await Promise.all([getExtraPages(), getSiteSettings()]);
  const extraRoutes = pages.map((page) => `/${page.slug}`);
  if (settings.galleryEnabled) extraRoutes.push("/galerie");
  if (settings.conferencesEnabled) extraRoutes.push("/conferences");

  return [...publicRoutes, ...extraRoutes].map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "/actualites" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
