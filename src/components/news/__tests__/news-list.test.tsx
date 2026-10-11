import { render, screen, within } from "@testing-library/react";
import { NewsList } from "../news-list";

test("separates upcoming and archived announcements", () => {
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
      ]}
    />,
  );

  expect(
    within(screen.getByRole("region", { name: /à venir/i })).getByText("Atelier"),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("region", { name: /archives/i })).getByText("Assemblée"),
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
    within(screen.getByRole("region", { name: /archives/i })).getByText(
      "Rencontre terminée",
    ),
  ).toBeInTheDocument();
});
