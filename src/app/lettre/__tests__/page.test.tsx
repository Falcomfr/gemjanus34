import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { bundledPlanning } from "@/content/planning";
import { publicContentRepository } from "@/lib/content/local-public-content-repository";
import LetterPage from "../page";

const note = vi.hoisted(() => ({ current: "Bonne semaine à toutes et à tous !" }));
vi.mock("@/lib/letter/letter-note", () => ({ getLetterNote: vi.fn(async () => note.current) }));
const settings = vi.hoisted(() => ({ current: { conferencesEnabled: false } }));
vi.mock("@/lib/settings/site-settings", () => ({ getSiteSettings: vi.fn(async () => settings.current) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        gte: () => ({
          order: async () => ({ data: [{ id: "c1", title: "Le sommeil", speaker: "Dr Martin", starts_at: "2026-12-03T17:30:00Z", place: "Au GEM" }], error: null }),
        }),
      }),
    }),
  })),
}));

const slot = bundledPlanning.slots.find((candidate) => candidate.day === 2 && candidate.recurrence === "weekly")!;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-09T10:00:00Z"));
  note.current = "Bonne semaine à toutes et à tous !";
  settings.current = { conferencesEnabled: false };
  vi.spyOn(publicContentRepository, "getPlanning").mockResolvedValue({
    ...bundledPlanning,
    exceptions: [
      { id: "c1", kind: "cancel", date: "2026-11-10", slotId: slot.id, hidden: false, reason: "Animatrice absente" },
      { id: "f1", kind: "closure", date: "2026-11-11", endDate: "2026-11-11", reason: "Armistice" },
    ],
  });
  vi.spyOn(publicContentRepository, "getNews").mockResolvedValue([
    { id: "n1", title: "Repas partagé", excerpt: "Chacun apporte un plat.", startsAt: "2026-11-20T11:00:00Z", endsAt: null, featured: false, status: "published" },
    { id: "n2", title: "Fête de fin d'année", excerpt: "Loin d'ici.", startsAt: "2027-01-30T11:00:00Z", endsAt: null, featured: false, status: "published" },
  ]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test("puts the week's news together: note, changes and what comes next", async () => {
  render(await LetterPage({ searchParams: Promise.resolve({ semaine: "2026-11-09" }) }));

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Quoi de neuf au GEM");
  expect(screen.getByRole("region", { name: "Le mot de l'équipe" })).toHaveTextContent("Bonne semaine à toutes et à tous !");

  const changes = screen.getByRole("region", { name: "Cette semaine, ça change" });
  expect(changes).toHaveTextContent("Armistice");
  expect(changes).toHaveTextContent(`${slot.title} annulé`);
  expect(changes).toHaveTextContent("Animatrice absente");

  // The association found the full weekly planning invasive: it repeated every activity, week after week.
  expect(screen.queryByRole("region", { name: "Le planning de la semaine" })).not.toBeInTheDocument();

  const next = screen.getByRole("region", { name: "À venir" });
  expect(next).toHaveTextContent("Repas partagé");
  expect(next).not.toHaveTextContent("Fête de fin d'année");
  expect(screen.getByRole("button", { name: /imprimer/i })).toBeInTheDocument();
});

test("leaves out the note when the team wrote none", async () => {
  note.current = "";
  render(await LetterPage({ searchParams: Promise.resolve({}) }));
  expect(screen.queryByRole("region", { name: "Le mot de l'équipe" })).not.toBeInTheDocument();
});

test("still shows the letter when no planning is stored", async () => {
  vi.spyOn(publicContentRepository, "getPlanning").mockResolvedValue(null);
  render(await LetterPage({ searchParams: Promise.resolve({}) }));

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Quoi de neuf au GEM");
  expect(screen.queryByRole("region", { name: "Le planning de la semaine" })).not.toBeInTheDocument();
});

test("announces the coming conferences once their page is switched on", async () => {
  settings.current = { conferencesEnabled: true };
  render(await LetterPage({ searchParams: Promise.resolve({}) }));
  expect(screen.getByRole("region", { name: "Conférences à venir" })).toHaveTextContent("Le sommeil");
});

test("says nothing of conferences while their page is off", async () => {
  render(await LetterPage({ searchParams: Promise.resolve({}) }));
  expect(screen.queryByRole("region", { name: "Conférences à venir" })).not.toBeInTheDocument();
});

test("shows each paragraph of the note apart", async () => {
  note.current = "Bonjour à tous.\n\nSortie vendredi.";
  render(await LetterPage({ searchParams: Promise.resolve({}) }));
  const region = screen.getByRole("region", { name: "Le mot de l'équipe" });
  expect(region.querySelectorAll("p")).toHaveLength(2);
});
