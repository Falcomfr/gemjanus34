import { cache } from "react";
import { getPublicContentRepository } from "./public-repository";

export const getPublicPage = cache(async (slug: string) => {
  const repository = getPublicContentRepository();
  return repository.getPage(slug);
});
