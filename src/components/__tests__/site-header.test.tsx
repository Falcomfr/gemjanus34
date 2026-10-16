import { fireEvent, render, screen, within } from "@testing-library/react";
import { SiteHeader } from "../site-header";

const expectedNavigation = [
  ["Le GEM", "/qui-sommes-nous"],
  ["Activités", "/activites"],
  ["Planning et actualités", "/actualites"],
  ["Première visite", "/nous-rejoindre"],
  ["Ressources", "/ressources"],
  ["Contact", "/contact"],
];

test.each([
  ["desktop", "Navigation principale"],
  ["mobile", "Navigation mobile"],
])("exposes the exact ordered %s navigation", (_variant, accessibleName) => {
  render(<SiteHeader />);
  const navigation = screen.getByRole("navigation", { name: accessibleName });
  const links = within(navigation)
    .getAllByRole("link")
    .filter((link) => !link.getAttribute("href")?.startsWith("tel:"));

  expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual(
    expectedNavigation,
  );
});

test("uses a neutral accessible label for the mobile menu disclosure", () => {
  const { container } = render(<SiteHeader />);
  const disclosure = container.querySelector("summary");

  expect(disclosure).toHaveAccessibleName("Menu");
});

test("closes the mobile menu after choosing a link", () => {
  const { container } = render(<SiteHeader />);
  const details = container.querySelector("details")!;
  details.open = true;

  fireEvent.click(
    within(screen.getByRole("navigation", { name: "Navigation mobile" })).getByRole("link", {
      name: "Contact",
    }),
  );

  expect(details.open).toBe(false);
});

test("keeps the phone number inside the mobile menu", () => {
  render(<SiteHeader />);

  expect(
    within(screen.getByRole("navigation", { name: "Navigation mobile" })).getByRole("link", {
      name: /04 67 04 87 68/,
    }),
  ).toHaveAttribute("href", "tel:+33467048768");
});

test("shows the association logo in the home link", () => {
  render(<SiteHeader />);
  const home = screen.getByRole("link", { name: "Janus34, accueil" });

  expect(home.querySelector("img")).toHaveAttribute("src", expect.stringContaining("janus34-logo"));
  expect(home).not.toHaveTextContent("J34");
});
