import { fireEvent, render, screen } from "@testing-library/react";
import ContactPage from "../contact/page";

test("prefers a phone call before a first visit and gives opening hours", () => {
  render(<ContactPage />);

  expect(screen.getByText(/une première visite se prépare de préférence par téléphone/i)).toBeInTheDocument();
  expect(screen.getByText("Le GEM ouvre à 13 h, du lundi au samedi.")).toBeInTheDocument();
  expect(screen.getByText(/405 rue des Grèzes, 34070 Montpellier/)).toBeInTheDocument();
});

test("loads the Google map only on request", () => {
  const { container } = render(<ContactPage />);

  expect(container.querySelector("iframe")).toBeNull();
  expect(screen.getByRole("link", { name: /ouvrir dans google maps/i })).toHaveAttribute("href", expect.stringContaining("google.com/maps"));
  fireEvent.click(screen.getByRole("button", { name: /afficher la carte/i }));

  expect(container.querySelector("iframe")).toHaveAttribute(
    "src",
    "https://www.google.com/maps?q=405+rue+des+Gr%C3%A8zes+34070+Montpellier&hl=fr&z=16&output=embed",
  );
});
