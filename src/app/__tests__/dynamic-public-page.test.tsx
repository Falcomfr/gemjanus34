import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { publicContentRepository } from "@/lib/content/local-public-content-repository";
import DynamicPublicPage, { generateMetadata } from "../[slug]/page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

afterEach(() => vi.restoreAllMocks());

test("renders a published repository page for a dynamic slug", async () => {
  vi.spyOn(publicContentRepository, "getPage").mockResolvedValue({
    slug: "nouvelle-page",
    title: "Nouvelle page",
    introduction: "Résumé public",
    sections: [{ id: "details", title: "Détails", body: "Contenu public" }],
  });

  render(await DynamicPublicPage({ params: Promise.resolve({ slug: "nouvelle-page" }) }));

  expect(screen.getByRole("heading", { level: 1, name: "Nouvelle page" })).toBeInTheDocument();
  expect(publicContentRepository.getPage).toHaveBeenCalledWith("nouvelle-page");
});

test("returns metadata from the repository page", async () => {
  vi.spyOn(publicContentRepository, "getPage").mockResolvedValue({
    slug: "nouvelle-page",
    title: "Nouvelle page",
    introduction: "Résumé public",
    sections: [],
  });

  await expect(generateMetadata({ params: Promise.resolve({ slug: "nouvelle-page" }) }))
    .resolves.toEqual({ title: "Nouvelle page", description: "Résumé public" });
});

test("uses notFound for an unknown slug", async () => {
  vi.spyOn(publicContentRepository, "getPage").mockResolvedValue(null);

  await expect(DynamicPublicPage({ params: Promise.resolve({ slug: "absente" }) }))
    .rejects.toThrow("NEXT_NOT_FOUND");
});
