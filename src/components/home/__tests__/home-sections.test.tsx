import { render, screen } from "@testing-library/react";
import type { NewsItem, PublicDocument } from "@/content/types";
import { CurrentPlanning } from "../current-planning";
import { UpcomingNews } from "../upcoming-news";

const planning: PublicDocument = {
  id: "planning",
  title: "Planning des activités",
  slug: "planning-des-activites",
  description: "Planning",
  category: "planning",
  mimeType: "application/pdf",
  updatedAt: "2026-06-22",
  downloadUrl: "/documents/planning-des-activites.pdf",
};

function news(id: string, startsAt: string): NewsItem {
  return { id, title: id, excerpt: id, startsAt, endsAt: null, featured: false, status: "published" };
}

test("presents the current planning with its effective date", () => {
  const { container } = render(<CurrentPlanning document={planning} />);

  expect(screen.getByRole("heading", { level: 2, name: "Le planning des activités" })).toBeInTheDocument();
  expect(screen.getByText(/en vigueur depuis le 22 juin 2026/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /consulter le planning \(pdf\)/i })).toHaveAttribute(
    "href",
    "/documents/planning-des-activites.pdf",
  );
  expect(container.querySelector("section")).toHaveAttribute("id", "planning");
  expect(container.textContent).not.toMatch(/import|ancien site|archive/i);
});

test("offers the phone when no planning document is available", () => {
  render(<CurrentPlanning />);

  expect(screen.getByText(/le planning est disponible auprès de l'équipe/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /04 67 04 87 68/ })).toHaveAttribute("href", "tel:+33467048768");
});

test("never presents archived news as recent on the home page", () => {
  render(<UpcomingNews items={[news("Assemblée générale 2025", "2025-05-10")]} now="2026-10-16T10:00:00+02:00" />);

  expect(screen.queryByText("Assemblée générale 2025")).not.toBeInTheDocument();
  expect(screen.getByText("Aucun rendez-vous n'est annoncé pour le moment.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Toutes les actualités" })).toHaveAttribute("href", "/actualites");
});

test("labels upcoming and recent news with their status", () => {
  render(
    <UpcomingNews
      items={[news("Sortie au musée", "2026-10-22"), news("Goûter", "2026-10-03")]}
      now="2026-10-16T10:00:00+02:00"
    />,
  );

  expect(screen.getByRole("heading", { name: "Sortie au musée" }).closest("article")).toHaveTextContent("À venir");
  expect(screen.getByRole("heading", { name: "Goûter" }).closest("article")).toHaveTextContent("Passé");
});
