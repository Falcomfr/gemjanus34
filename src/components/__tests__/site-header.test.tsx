import { render, screen } from "@testing-library/react";
import { SiteHeader } from "../site-header";

test("exposes the seven public destinations", () => {
  render(<SiteHeader />);
  const links = screen.getAllByRole("link");
  expect(links.map((link) => link.textContent)).toEqual(
    expect.arrayContaining([
      "Accueil",
      "Qui sommes-nous ?",
      "Activités",
      "Planning et actualités",
      "Nous rejoindre",
      "Ressources",
      "Contact",
    ]),
  );
});
