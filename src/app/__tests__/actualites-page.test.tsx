import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { publicContentRepository } from "@/lib/content/local-public-content-repository";
import { addDays, currentMonday, weekRangeLabel } from "@/lib/planning/week";
import NewsPage from "../actualites/page";

vi.mock("next/headers", () => ({ headers: async () => new Headers({ host: "gemjanus34.fr" }) }));
const settings = vi.hoisted(() => ({ current: { conferencesEnabled: false } }));
vi.mock("@/lib/settings/site-settings", () => ({ getSiteSettings: vi.fn(async () => settings.current) }));

afterEach(() => vi.restoreAllMocks());

test("shows the weekly planning first, with its printable version", async () => {
  render(await NewsPage());

  expect(screen.getByRole("heading", { level: 2, name: "Le planning des activités" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: /jeudi/i })).toHaveTextContent("Yoga en douceur");
  expect(screen.getByRole("link", { name: /version imprimable/i })).toHaveAttribute("href", "/planning/imprimer");
  expect(screen.getByRole("link", { name: /agenda du téléphone/i })).toHaveAttribute("href", "webcal://gemjanus34.fr/planning.ics");
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

test("links to the printable letter of the week", async () => {
  render(await NewsPage());
  expect(screen.getByRole("link", { name: /lettre de la semaine/i })).toHaveAttribute("href", "/lettre");
});

test("points to the conferences only once their page is switched on", async () => {
  settings.current = { conferencesEnabled: false };
  const { unmount } = render(await NewsPage());
  expect(screen.queryByRole("link", { name: /conférences/i })).not.toBeInTheDocument();
  unmount();

  settings.current = { conferencesEnabled: true };
  render(await NewsPage());
  expect(screen.getByRole("link", { name: /conférences/i })).toHaveAttribute("href", "/conferences");
});
