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

test("adds the pages created in the admin to the site map", async () => {
  const { SiteFooter: Footer } = await import("../site-footer");
  render(await Footer({ extraPages: [{ slug: "sortie-au-musee", title: "Sortie au musée" }] }));

  expect(within(screen.getByRole("navigation", { name: "Plan du site" })).getByRole("link", { name: "Sortie au musée" }))
    .toHaveAttribute("href", "/sortie-au-musee");
});
