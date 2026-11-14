import { fireEvent, render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import { SiteHeader } from "../site-header";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

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

test.each([
  ["desktop", "Navigation principale"],
  ["mobile", "Navigation mobile"],
])("adds the published pages without a parent page to the %s navigation, before Ressources", (_variant, accessibleName) => {
  render(
    <SiteHeader
      extraPages={[
        { slug: "prises-de-parole", title: "Prises de parole", parentId: null },
        { slug: "sous-page", title: "Sous-page", parentId: "11111111-1111-4111-8111-111111111111" },
      ]}
    />,
  );
  const links = within(screen.getByRole("navigation", { name: accessibleName }))
    .getAllByRole("link")
    .filter((link) => !link.getAttribute("href")?.startsWith("tel:"));

  expect(links.map((link) => link.getAttribute("href"))).toEqual([
    "/qui-sommes-nous",
    "/activites",
    "/actualites",
    "/nous-rejoindre",
    "/prises-de-parole",
    "/ressources",
    "/contact",
  ]);
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

test("closes the mobile menu with Escape or a tap outside", () => {
  const { container } = render(<SiteHeader />);
  const details = container.querySelector("details")!;

  details.open = true;
  fireEvent.keyDown(document, { key: "Escape" });
  expect(details.open).toBe(false);

  details.open = true;
  fireEvent.pointerDown(document.body);
  expect(details.open).toBe(false);
});

test("marks the current page in both navigations", () => {
  pathname.current = "/activites";
  render(<SiteHeader />);

  for (const name of ["Navigation principale", "Navigation mobile"]) {
    const nav = screen.getByRole("navigation", { name });
    expect(within(nav).getByRole("link", { name: "Activités" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Contact" })).not.toHaveAttribute("aria-current");
  }
});

test("becomes compact once the page scrolls, and full again at the top", () => {
  render(<SiteHeader />);
  const header = screen.getByRole("banner");
  expect(header).not.toHaveClass("site-header--compact");

  Object.defineProperty(window, "scrollY", { configurable: true, value: 120 });
  fireEvent.scroll(window);
  expect(header).toHaveClass("site-header--compact");

  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  fireEvent.scroll(window);
  expect(header).not.toHaveClass("site-header--compact");
});

const menuHrefs = (accessibleName: string) =>
  within(screen.getByRole("navigation", { name: accessibleName }))
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"))
    .filter((href) => !href?.startsWith("tel:"));

test.each([
  ["desktop", "Navigation principale"],
  ["mobile", "Navigation mobile"],
])("puts the switched-on gallery in the %s navigation right after the first added page", (_variant, accessibleName) => {
  render(
    <SiteHeader
      galleryEnabled
      extraPages={[
        { slug: "sorties", title: "Sorties", parentId: null },
        { slug: "ils-ont-parle", title: "Ils ont parlé", parentId: null },
      ]}
    />,
  );
  expect(menuHrefs(accessibleName)).toEqual([
    "/qui-sommes-nous", "/activites", "/actualites", "/nous-rejoindre", "/sorties", "/galerie", "/ils-ont-parle", "/ressources", "/contact",
  ]);
});

test("puts the switched-on gallery before Ressources when no page was added", () => {
  render(<SiteHeader galleryEnabled />);
  expect(menuHrefs("Navigation principale").slice(-3)).toEqual(["/galerie", "/ressources", "/contact"]);
});

test("leaves the switched-off gallery out of the menu", () => {
  render(<SiteHeader extraPages={[{ slug: "sorties", title: "Sorties", parentId: null }]} />);
  expect(menuHrefs("Navigation principale")).not.toContain("/galerie");
});
