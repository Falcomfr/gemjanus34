import { render, screen, within } from "@testing-library/react";
import { SiteFooter } from "../site-footer";

test("shows the association's partners on every page", () => {
  render(<SiteFooter />);
  const partners = screen.getByRole("region", { name: "Nos partenaires" });

  expect(within(partners).getAllByRole("img").map((image) => image.getAttribute("alt"))).toEqual([
    "Agence Régionale de Santé Occitanie",
    "Région Occitanie",
    "FNAPSY, les usagers en santé mentale",
  ]);
});
