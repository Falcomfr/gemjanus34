import { render, screen, within } from "@testing-library/react";
import { SiteHeader } from "../site-header";

const expectedNavigation = [
  ["Accueil", "/"],
  ["Qui sommes-nous ?", "/qui-sommes-nous"],
  ["Activités", "/activites"],
  ["Planning et actualités", "/actualites"],
  ["Nous rejoindre", "/nous-rejoindre"],
  ["Ressources", "/ressources"],
  ["Contact", "/contact"],
];

test.each([
  ["desktop", "Navigation principale"],
  ["mobile", "Navigation mobile"],
])("exposes the exact ordered %s navigation", (_variant, accessibleName) => {
  render(<SiteHeader />);
  const navigation = screen.getByRole("navigation", { name: accessibleName });
  const links = within(navigation).getAllByRole("link");

  expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual(
    expectedNavigation,
  );
});

test("uses a neutral accessible label for the mobile menu disclosure", () => {
  const { container } = render(<SiteHeader />);
  const disclosure = container.querySelector("summary");

  expect(disclosure).toHaveAccessibleName("Menu");
});
