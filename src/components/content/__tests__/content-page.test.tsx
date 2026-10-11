import { render, screen } from "@testing-library/react";
import { ContentPage } from "../content-page";

test("renders structured sections and document downloads", () => {
  render(
    <ContentPage
      page={{
        slug: "exemple",
        title: "Titre",
        introduction: "Introduction",
        sections: [{ id: "section", title: "Section", body: "Contenu" }],
      }}
      documents={[
        {
          id: "doc-1",
          title: "Statuts",
          slug: "statuts",
          description: "Statuts de l'association",
          category: "institutional",
          mimeType: "application/pdf",
          updatedAt: "2026-10-11",
          downloadUrl: "/documents/statuts",
        },
      ]}
    />,
  );
  expect(screen.getByRole("heading", { level: 1, name: "Titre" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "Section" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /télécharger statuts/i })).toHaveAttribute(
    "href",
    "/documents/statuts",
  );
});
