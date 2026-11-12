import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { SiteFooter } from "../site-footer";

// Marks the links routed on the client by next/link.
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} data-client-route="" {...props}>{children}</a>
  ),
}));

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
  render(await Footer({ extraPages: [{ slug: "sortie-au-musee", title: "Sortie au musée", parentId: null }] }));

  expect(within(screen.getByRole("navigation", { name: "Plan du site" })).getByRole("link", { name: "Sortie au musée" }))
    .toHaveAttribute("href", "/sortie-au-musee");
});

test("shows the membership link in the footer only when there is one", () => {
  const { unmount } = render(<SiteFooter />);
  expect(screen.queryByRole("link", { name: /adhérer ou faire un don/i })).not.toBeInTheDocument();
  unmount();

  render(<SiteFooter membershipHref="https://www.helloasso.com/associations/janus34" />);
  expect(screen.getByRole("link", { name: /adhérer ou faire un don/i })).toBeInTheDocument();
});

test("opens the administration with a full page load, so the public visit counter stays behind", () => {
  render(<SiteFooter />);

  const link = screen.getByRole("link", { name: "Administration" });
  expect(link).toHaveAttribute("href", "/admin");
  expect(link).not.toHaveAttribute("data-client-route");
});

test("lists the gallery in the site map only when it is switched on", () => {
  const { unmount } = render(<SiteFooter />);
  expect(screen.queryByRole("link", { name: "Galerie" })).not.toBeInTheDocument();
  unmount();

  render(<SiteFooter galleryEnabled />);
  expect(screen.getByRole("link", { name: "Galerie" })).toHaveAttribute("href", "/galerie");
});

test("lists the conferences in the site map only when the page is switched on", () => {
  const { unmount } = render(<SiteFooter />);
  expect(screen.queryByRole("link", { name: "Conférences" })).not.toBeInTheDocument();
  unmount();

  render(<SiteFooter conferencesEnabled />);
  expect(screen.getByRole("link", { name: "Conférences" })).toHaveAttribute("href", "/conferences");
});
