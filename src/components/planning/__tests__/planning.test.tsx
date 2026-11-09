import { fireEvent, render, screen, within } from "@testing-library/react";
import { bundledPlanning } from "@/content/planning";
import type { Planning, PlanningException } from "@/content/types";
import { formatHour } from "../planning-format";
import { TodayAtGem } from "../today-at-gem";
import { WeekPlanning } from "../week-planning";

test("formats hours the French way", () => {
  expect(formatHour("14:00")).toBe("14 h");
  expect(formatHour("14:30")).toBe("14 h 30");
  expect(formatHour("09:05")).toBe("9 h 05");
});

const withExceptions = (...exceptions: PlanningException[]): Planning => ({ ...bundledPlanning, exceptions });

test("shows the dated week day by day with hours, team, leaders and a legend", () => {
  render(<WeekPlanning planning={bundledPlanning} monday="2026-10-19" today="2026-10-20" />);

  expect(screen.getByText("Semaine du 19 au 24 octobre 2026")).toBeInTheDocument();
  const tuesday = screen.getByRole("region", { name: /mardi 20 octobre/i });
  expect(tuesday).toHaveTextContent("Aujourd'hui");
  expect(tuesday).toHaveTextContent("13 h – 18 h");
  expect(tuesday).toHaveTextContent("Mona et Elif");
  const qiGong = within(tuesday).getByText("Qi Gong").closest("li")!;
  expect(qiGong).toHaveTextContent("14 h 30 – 15 h 30");
  expect(qiGong).toHaveTextContent("avec Adrien");
  expect(qiGong).toHaveClass("planning-slot--bouger");
  expect(screen.getAllByRole("region", { name: /^(lundi|mardi|mercredi|jeudi|vendredi|samedi)/i })).toHaveLength(6);
  expect(screen.getByText(/En vigueur depuis le 22 juin 2026\./)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /version imprimable/i })).toHaveAttribute("href", "/planning/imprimer");
  expect(screen.getByText("Créer et s'exprimer")).toBeInTheDocument();
});

test("shows a monthly session only on its week", () => {
  const { unmount } = render(<WeekPlanning planning={bundledPlanning} monday="2026-10-26" />);
  const lastThursday = screen.getByRole("region", { name: /jeudi 29 octobre/i });
  expect(lastThursday).toHaveTextContent("Soupe au caillou");
  expect(within(lastThursday).queryByText("GEM « Hors les murs »")).not.toBeInTheDocument();
  unmount();

  render(<WeekPlanning planning={bundledPlanning} monday="2026-10-19" />);
  const fourthThursday = screen.getByRole("region", { name: /jeudi 22 octobre/i });
  expect(fourthThursday).not.toHaveTextContent("Soupe au caillou");
  expect(within(fourthThursday).getByText("GEM « Hors les murs »")).toBeInTheDocument();
});

test("strikes a cancelled session with its reason, hides a hidden one, closes a day and marks an exceptional session", () => {
  const planning = withExceptions(
    { id: "c1", kind: "cancel", date: "2026-10-20", slotId: "mardi-qi-gong", hidden: false, reason: "Adrien absent" },
    { id: "c2", kind: "cancel", date: "2026-10-22", slotId: "jeudi-yoga", hidden: true, reason: "" },
    { id: "f1", kind: "closure", date: "2026-10-23", endDate: "2026-10-23", reason: "Pont" },
    { id: "e1", kind: "extra", date: "2026-10-21", startsAt: "10:00", endsAt: "12:00", title: "Atelier invité", leader: "Lou", description: "", family: "creer" },
  );
  render(<WeekPlanning planning={planning} monday="2026-10-19" />);

  const qiGong = within(screen.getByRole("region", { name: /mardi/i })).getByText("Qi Gong").closest("li")!;
  expect(qiGong).toHaveClass("planning-slot--cancelled");
  expect(qiGong).toHaveTextContent("Annulé");
  expect(qiGong).toHaveTextContent("Adrien absent");
  expect(screen.getByRole("region", { name: /jeudi/i })).not.toHaveTextContent("Yoga en douceur");
  const friday = screen.getByRole("region", { name: /vendredi/i });
  expect(friday).toHaveTextContent("GEM fermé");
  expect(friday).toHaveTextContent("Pont");
  expect(friday).not.toHaveTextContent("Linogravure");
  const extra = within(screen.getByRole("region", { name: /mercredi/i })).getByText("Atelier invité").closest("li")!;
  expect(extra).toHaveTextContent("Exceptionnel");
});

test("moves from week to week and prints the week shown", () => {
  render(<WeekPlanning planning={bundledPlanning} monday="2026-10-19" navigation={{ previous: "2026-10-12", next: "2026-10-26" }} />);

  expect(screen.getByRole("link", { name: /semaine précédente/i })).toHaveAttribute("href", "/actualites?semaine=2026-10-12#planning");
  expect(screen.getByRole("link", { name: /semaine suivante/i })).toHaveAttribute("href", "/actualites?semaine=2026-10-26#planning");
  expect(screen.getByRole("link", { name: /version imprimable/i })).toHaveAttribute("href", "/planning/imprimer?semaine=2026-10-19");
});

test("tells what happens at the GEM today", () => {
  render(<TodayAtGem planning={bundledPlanning} now="2026-10-15T08:00:00Z" />);

  const today = screen.getByRole("region", { name: "Aujourd'hui au GEM" });
  expect(today).toHaveTextContent("Jeudi 15 octobre");
  expect(today).toHaveTextContent("Yoga en douceur");
  expect(today).toHaveTextContent("Hors les murs");
  expect(today).not.toHaveTextContent("Soupe au caillou");
  expect(today).toHaveTextContent("13 h – 18 h");
  expect(within(today).getByRole("link", { name: /tout le planning/i })).toHaveAttribute("href", "/actualites#planning");
});

test("announces the next opening day on Sunday", () => {
  render(<TodayAtGem planning={bundledPlanning} now="2026-10-18T10:00:00Z" />);

  expect(screen.getByRole("region", { name: "Lundi au GEM" })).toHaveTextContent("Expression créatrice");
});

test("says the GEM is closed today and gives the next opening day", () => {
  const planning = withExceptions({ id: "f1", kind: "closure", date: "2026-11-11", endDate: "2026-11-11", reason: "Armistice" });
  render(<TodayAtGem planning={planning} now="2026-11-11T09:00:00Z" />);

  const next = screen.getByRole("region", { name: "Jeudi au GEM" });
  expect(next).toHaveTextContent("Le GEM est fermé aujourd’hui : Armistice.");
  expect(next).toHaveTextContent("Jeudi 12 novembre");
});

test("still says the GEM is closed when no opening day is in sight", () => {
  const planning = withExceptions({ id: "f1", kind: "closure", date: "2026-08-03", endDate: "2027-08-03", reason: "Travaux" });
  render(<TodayAtGem planning={planning} now="2026-08-04T09:00:00Z" />);

  expect(screen.getByRole("region", { name: "Aujourd'hui au GEM" })).toHaveTextContent("Le GEM est fermé aujourd’hui : Travaux.");
});

test("opens a window with everything about an activity, and closes it", () => {
  render(<WeekPlanning planning={bundledPlanning} monday="2026-10-19" />);

  fireEvent.click(screen.getByRole("button", { name: /qi gong/i }));

  const dialog = screen.getByRole("dialog", { name: "Qi Gong" });
  expect(dialog).toHaveTextContent("Mardi 20 octobre, 14 h 30 – 15 h 30");
  expect(dialog).toHaveTextContent("avec Adrien");
  expect(dialog).toHaveTextContent("Bouger et prendre l'air");
  expect(dialog).toHaveTextContent("Une gymnastique douce d'origine chinoise");
  expect(within(dialog).getByRole("link", { name: /toutes les activités/i })).toHaveAttribute("href", "/activites");
  expect(within(dialog).getByRole("link", { name: /04 67 04 87 68/ })).toHaveAttribute("href", "tel:+33467048768");

  fireEvent.click(within(dialog).getByRole("button", { name: "Fermer" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("the window gives the recurrence and the cancellation", () => {
  const planning = withExceptions({ id: "c1", kind: "cancel", date: "2026-10-29", slotId: "jeudi-soupe", hidden: false, reason: "Elif en formation" });
  render(<WeekPlanning planning={planning} monday="2026-10-26" />);

  fireEvent.click(screen.getByRole("button", { name: /soupe au caillou/i }));

  const dialog = screen.getByRole("dialog", { name: "Soupe au caillou" });
  expect(dialog).toHaveTextContent("Le dernier jeudi du mois");
  expect(dialog).toHaveTextContent("Annulé le jeudi 29 octobre : Elif en formation.");
});

test("keeps the printable planning free of buttons", () => {
  render(<WeekPlanning planning={bundledPlanning} monday="2026-10-19" printable />);

  expect(screen.queryAllByRole("button")).toHaveLength(0);
});

test("offers to add the planning to a phone or Google calendar", () => {
  render(<WeekPlanning planning={bundledPlanning} monday="2026-10-19" calendarHost="gemjanus34.fr" />);

  const subscribe = screen.getByRole("region", { name: "Ajouter le planning à mon agenda" });
  expect(within(subscribe).getByRole("link", { name: /agenda du téléphone/i })).toHaveAttribute("href", "webcal://gemjanus34.fr/planning.ics");
  expect(within(subscribe).getByRole("link", { name: /google agenda/i })).toHaveAttribute(
    "href",
    "https://calendar.google.com/calendar/r?cid=webcal%3A%2F%2Fgemjanus34.fr%2Fplanning.ics",
  );
});

test("the printed planning has no calendar links", () => {
  render(<WeekPlanning planning={bundledPlanning} monday="2026-10-19" printable />);

  expect(screen.queryByRole("region", { name: "Ajouter le planning à mon agenda" })).not.toBeInTheDocument();
});
