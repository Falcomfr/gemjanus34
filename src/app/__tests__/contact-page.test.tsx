import { render, screen } from "@testing-library/react";
import ContactPage from "../contact/page";

test("prefers a phone call before a first visit and gives opening hours", () => {
  render(<ContactPage />);

  expect(screen.getByText(/une première visite se prépare de préférence par téléphone/i)).toBeInTheDocument();
  expect(screen.getByText("Le GEM ouvre à 13 h, du lundi au samedi.")).toBeInTheDocument();
  expect(screen.getByText(/405 rue des Grèzes, 34070 Montpellier/)).toBeInTheDocument();
});
