import { render, screen, within } from "@testing-library/react";
import { bundledPlanning } from "@/content/planning";
import { formatHour, parisWeekday } from "../planning-format";
import { TodayAtGem } from "../today-at-gem";
import { WeekPlanning } from "../week-planning";

test("formats hours the French way", () => {
  expect(formatHour("14:00")).toBe("14 h");
  expect(formatHour("14:30")).toBe("14 h 30");
  expect(formatHour("09:05")).toBe("9 h 05");
});

test("finds the weekday in Paris, not in UTC", () => {
  expect(parisWeekday("2026-10-13T23:30:00Z")).toBe(3); // already Wednesday in Paris
  expect(parisWeekday("2026-10-18T10:00:00Z")).toBe(7);
});

test("shows the week day by day with hours, team, leaders and a legend", () => {
  render(<WeekPlanning planning={bundledPlanning} today={2} />);

  const tuesday = screen.getByRole("region", { name: /mardi/i });
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

test("tells what happens at the GEM today", () => {
  render(<TodayAtGem planning={bundledPlanning} now="2026-10-15T08:00:00Z" />);

  const today = screen.getByRole("region", { name: "Aujourd'hui au GEM" });
  expect(today).toHaveTextContent("Jeudi");
  expect(today).toHaveTextContent("Yoga en douceur");
  expect(today).toHaveTextContent("13 h – 18 h");
  expect(within(today).getByRole("link", { name: /tout le planning/i })).toHaveAttribute("href", "/actualites#planning");
});

test("announces the next opening day on Sunday", () => {
  render(<TodayAtGem planning={bundledPlanning} now="2026-10-18T10:00:00Z" />);

  expect(screen.getByRole("region", { name: "Lundi au GEM" })).toHaveTextContent("Expression créatrice");
});
