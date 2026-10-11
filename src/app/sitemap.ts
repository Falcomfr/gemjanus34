import type { MetadataRoute } from "next";

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

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "/actualites" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
