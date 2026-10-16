import { existsSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { AdminShell } from "../admin-shell";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/app/admin/connexion/actions", () => ({
  logout: vi.fn(),
}));

const profile = {
  id: "00000000-0000-0000-0000-000000000001",
  displayName: "Camille",
  role: "editor" as const,
  active: true,
  notifyOnPublish: true,
};

test("marks only the current administration section", () => {
  render(
    <AdminShell pathname="/admin/pages/une-page" profile={profile}>
      <p>Contenu</p>
    </AdminShell>,
  );

  expect(screen.getByRole("link", { name: "Pages" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.getByRole("link", { name: "Tableau de bord" })).not.toHaveAttribute(
    "aria-current",
  );
});

test("exposes navigation labels as icon tooltips", () => {
  render(
    <AdminShell pathname="/admin" profile={profile}>
      <p>Contenu</p>
    </AdminShell>,
  );

  expect(screen.getByRole("link", { name: "Pages" })).toHaveAttribute(
    "title",
    "Pages",
  );
});

test("links every administration section to an existing page", () => {
  render(
    <AdminShell pathname="/admin" profile={profile}>
      <p>Contenu</p>
    </AdminShell>,
  );
  const navigation = screen.getByRole("navigation", { name: "Navigation de l’administration" });

  for (const link of within(navigation).getAllByRole("link")) {
    const route = link.getAttribute("href")!;
    expect(existsSync(join(process.cwd(), "src/app", route, "page.tsx")), route).toBe(true);
  }
  expect(within(navigation).getAllByRole("link").map((link) => link.textContent)).toEqual([
    "Tableau de bord",
    "Pages",
    "Actualités",
    "Planning",
    "Documents",
    "Messages",
  ]);
});

test("offers a way back to the public site", () => {
  render(
    <AdminShell pathname="/admin" profile={profile}>
      <p>Contenu</p>
    </AdminShell>,
  );

  expect(screen.getByRole("link", { name: /voir le site/i })).toHaveAttribute("href", "/");
});

test("shows the two faces of the logo, which fit a small round badge", () => {
  const { container } = render(
    <AdminShell pathname="/admin" profile={profile}>
      <p>Contenu</p>
    </AdminShell>,
  );

  expect(container.querySelector(".admin-sidebar__logo")).toHaveAttribute("src", expect.stringContaining("janus34-visages.svg"));
});

test("offers account management to administrators and 'Mon compte' to everyone", () => {
  const { unmount } = render(
    <AdminShell pathname="/admin" profile={{ ...profile, role: "admin" }}>
      <p>Contenu</p>
    </AdminShell>,
  );
  expect(screen.getByRole("link", { name: "Comptes" })).toHaveAttribute("href", "/admin/comptes");
  expect(screen.getByRole("link", { name: /mon compte/i })).toHaveAttribute("href", "/admin/mon-compte");
  unmount();

  render(
    <AdminShell pathname="/admin" profile={profile}>
      <p>Contenu</p>
    </AdminShell>,
  );
  expect(screen.queryByRole("link", { name: "Comptes" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: /mon compte/i })).toBeInTheDocument();
});
