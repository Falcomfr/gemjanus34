import { render, screen, within } from "@testing-library/react";
import { NewsList } from "../news-list";

test("separates upcoming, recent and archived announcements", () => {
  render(
    <NewsList
      now="2026-10-11T12:00:00+02:00"
      items={[
        {
          id: "future",
          title: "Atelier",
          excerpt: "Création",
          startsAt: "2026-10-15T14:00:00+02:00",
          endsAt: null,
          featured: true,
          status: "published",
        },
        {
          id: "past",
          title: "Assemblée",
          excerpt: "Compte rendu",
          startsAt: "2026-09-01T14:00:00+02:00",
          endsAt: null,
          featured: false,
          status: "published",
        },
        {
          id: "old",
          title: "Assemblée générale 2025",
          excerpt: "Compte rendu",
          startsAt: "2025-05-10",
          endsAt: null,
          featured: false,
          status: "published",
        },
      ]}
    />,
  );

  expect(
    within(screen.getByRole("region", { name: /à venir/i })).getByText("Atelier"),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("region", { name: /informations récentes/i })).getByText("Assemblée"),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("region", { name: /archives/i })).getByText("Assemblée générale 2025"),
  ).toBeInTheDocument();
});

test("keeps date-only announcements upcoming until the Paris calendar day ends", () => {
  render(
    <NewsList
      now="2026-10-12T20:00:00Z"
      items={[
        {
          id: "today-in-paris",
          title: "Rencontre du jour",
          excerpt: "Une rencontre sans horaire précis",
          startsAt: "2026-10-12",
          endsAt: null,
          featured: true,
          status: "published",
        },
        {
          id: "finished-instant",
          title: "Rencontre terminée",
          excerpt: "Une rencontre avec un horaire précis",
          startsAt: "2026-10-12T19:00:00Z",
          endsAt: null,
          featured: false,
          status: "published",
        },
      ]}
    />,
  );

  expect(
    within(screen.getByRole("region", { name: /à venir/i })).getByText("Rencontre du jour"),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("region", { name: /informations récentes/i })).getByText(
      "Rencontre terminée",
    ),
  ).toBeInTheDocument();
});

test("orders announcements by instant across differing and equivalent offsets", () => {
  render(
    <NewsList
      now="2026-10-15T00:00:00Z"
      items={[
        {
          id: "equivalent-z",
          title: "Même instant UTC",
          excerpt: "Premier élément équivalent",
          startsAt: "2026-10-15T09:00:00Z",
          endsAt: null,
          featured: false,
          status: "published",
        },
        {
          id: "earlier-offset",
          title: "Plus tôt avec décalage",
          excerpt: "Commence avant les deux autres",
          startsAt: "2026-10-15T10:30:00+02:00",
          endsAt: null,
          featured: false,
          status: "published",
        },
        {
          id: "equivalent-offset",
          title: "Même instant décalé",
          excerpt: "Second élément équivalent",
          startsAt: "2026-10-15T11:00:00+02:00",
          endsAt: null,
          featured: false,
          status: "published",
        },
      ]}
    />,
  );

  expect(
    within(screen.getByRole("region", { name: /à venir/i }))
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent),
  ).toEqual(["Plus tôt avec décalage", "Même instant UTC", "Même instant décalé"]);
});
