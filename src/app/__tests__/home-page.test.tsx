import { render, screen } from "@testing-library/react";
import HomePage from "../page";

test("puts practical information and the current planning on the home page", async () => {
  render(await HomePage());
  expect(screen.getByRole("heading", { level: 1, name: /janus34/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /voir le planning/i })).toHaveAttribute("href", expect.stringContaining("/documents/"));
  expect(screen.getByRole("link", { name: /04 67 04 87 68/ })).toHaveAttribute("href", "tel:+33467048768");
  expect(screen.getByText(/405 rue des grèzes/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /nous rejoindre/i })).toHaveAttribute("href", "/nous-rejoindre");
});
