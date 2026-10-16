import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { publicContentRepository } from "@/lib/content/local-public-content-repository";
import { addDays, currentMonday, weekRangeLabel } from "@/lib/planning/week";
import NewsPage from "../actualites/page";

afterEach(() => vi.restoreAllMocks());

test("shows the weekly planning first, with its printable version", async () => {
  render(await NewsPage());

  expect(screen.getByRole("heading", { level: 2, name: "Le planning des activités" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: /jeudi/i })).toHaveTextContent("Yoga en douceur");
  expect(screen.getByRole("link", { name: /version imprimable/i })).toHaveAttribute("href", "/planning/imprimer");
});

test("keeps the PDF planning when no planning is stored", async () => {
  vi.spyOn(publicContentRepository, "getPlanning").mockResolvedValue(null);
  render(await NewsPage());

  expect(screen.getByRole("link", { name: /consulter le planning \(pdf\)/i })).toBeInTheDocument();
});

test("shows the week asked for and links to the weeks around it", async () => {
  const next = addDays(currentMonday(new Date().toISOString()), 7);
  render(await NewsPage({ searchParams: Promise.resolve({ semaine: next }) }));

  expect(screen.getByText(weekRangeLabel(next))).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /semaine suivante/i })).toHaveAttribute("href", `/actualites?semaine=${addDays(next, 7)}#planning`);
  expect(screen.getByRole("link", { name: /semaine précédente/i })).toBeInTheDocument();
});
