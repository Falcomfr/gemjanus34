import { render, screen } from "@testing-library/react";
import NotFound from "../not-found";

test("explains in French that the page does not exist and offers a way out", () => {
  render(<NotFound />);

  expect(screen.getByRole("heading", { level: 1, name: "Page introuvable" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /retour à l.accueil/i })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: /04 67 04 87 68/ })).toHaveAttribute("href", "tel:+33467048768");
});
