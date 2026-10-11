import { render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import type { PublicDocument } from "@/content/types";
import { publicContentRepository } from "@/lib/content/local-public-content-repository";
import HomePage from "../page";

afterEach(() => {
  vi.restoreAllMocks();
});

test("puts practical information and the current planning on the home page", async () => {
  render(await HomePage());
  expect(screen.getByRole("heading", { level: 1, name: /janus34/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /voir le planning/i })).toHaveAttribute("href", expect.stringContaining("/documents/"));
  expect(screen.getByRole("link", { name: /04 67 04 87 68/ })).toHaveAttribute("href", "tel:+33467048768");
  expect(screen.getByText(/405 rue des grèzes/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /nous rejoindre/i })).toHaveAttribute("href", "/nous-rejoindre");
});

test("uses the most recently updated planning regardless of repository order", async () => {
  const planningDocuments: PublicDocument[] = [
    {
      id: "older-planning",
      title: "Planning précédent",
      slug: "planning-precedent",
      description: "Planning précédent",
      category: "planning",
      mimeType: "application/pdf",
      updatedAt: "2026-09-15",
      downloadUrl: "/documents/planning-precedent",
    },
    {
      id: "latest-planning",
      title: "Dernier planning",
      slug: "dernier-planning",
      description: "Dernier planning",
      category: "planning",
      mimeType: "application/pdf",
      updatedAt: "2026-10-10",
      downloadUrl: "/documents/dernier-planning",
    },
    {
      id: "middle-planning",
      title: "Planning intermédiaire",
      slug: "planning-intermediaire",
      description: "Planning intermédiaire",
      category: "planning",
      mimeType: "application/pdf",
      updatedAt: "2026-10-01",
      downloadUrl: "/documents/planning-intermediaire",
    },
  ];
  vi.spyOn(publicContentRepository, "getDocuments").mockResolvedValueOnce(planningDocuments);

  render(await HomePage());

  expect(screen.getByRole("link", { name: /voir le planning/i })).toHaveAttribute(
    "href",
    "/documents/dernier-planning",
  );
  expect(screen.getByRole("link", { name: /consulter le planning importé/i })).toHaveAttribute(
    "href",
    "/documents/dernier-planning",
  );
});

test("shows accurate and useful actions when no planning is available", async () => {
  vi.spyOn(publicContentRepository, "getDocuments").mockResolvedValueOnce([]);

  render(await HomePage());

  expect(screen.queryByRole("link", { name: /voir le planning/i })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: /découvrir les activités/i })).toHaveAttribute(
    "href",
    "/activites",
  );
  expect(
    screen.getByRole("heading", { level: 2, name: /planning à venir/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/le prochain planning sera publié ici/i)).toBeInTheDocument();
});
