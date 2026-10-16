import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { addDays, currentMonday, weekRangeLabel } from "@/lib/planning/week";
import PrintablePlanningPage from "../page";

test("lays out the whole week for printing and opens the print dialog", async () => {
  const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
  render(await PrintablePlanningPage());

  expect(screen.getByRole("heading", { level: 2, name: "Planning d'activités Janus34" })).toBeInTheDocument();
  expect(screen.getAllByRole("region", { name: /^(lundi|mardi|mercredi|jeudi|vendredi|samedi)/i })).toHaveLength(6);
  expect(screen.getByText(/04 67 04 87 68/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /imprimer ou enregistrer en pdf/i }));
  expect(print).toHaveBeenCalled();
});

test("prints the week asked for", async () => {
  const later = addDays(currentMonday(new Date().toISOString()), 14);
  render(await PrintablePlanningPage({ searchParams: Promise.resolve({ semaine: later }) }));

  expect(screen.getByText(weekRangeLabel(later))).toBeInTheDocument();
});
