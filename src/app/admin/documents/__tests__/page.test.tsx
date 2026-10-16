import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import AdminDocumentsPage from "../page";

vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn() }));
vi.mock("../actions", () => ({ uploadDocument: vi.fn(), deleteDocument: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        order: () => ({
          order: async () => ({
            data: [
              { id: "d1", title: "Planning des activités", description: "Hebdomadaire", category: "planning", document_date: "2026-06-22", url: "/documents/planning-des-activites.pdf" },
              { id: "d2", title: "Statuts", description: "2009", category: "institutional", document_date: "2009-04-01", url: "/documents/statuts-association.pdf" },
            ],
            error: null,
          }),
        }),
      }),
    }),
  })),
}));

test("lists documents by category with a way to open and delete each one", async () => {
  render(await AdminDocumentsPage());

  const planning = screen.getByRole("region", { name: "Planning" });
  expect(within(planning).getByRole("link", { name: /ouvrir planning des activités/i })).toHaveAttribute(
    "href",
    "/documents/planning-des-activites.pdf",
  );
  expect(within(planning).getByRole("button", { name: /supprimer planning des activités/i })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: /association/i })).toHaveTextContent("Statuts");
});

test("offers an upload form limited to PDF files", async () => {
  render(await AdminDocumentsPage());

  const file = screen.getByLabelText(/fichier pdf/i);
  expect(file).toHaveAttribute("accept", "application/pdf,.pdf");
  expect(screen.getByLabelText("Catégorie")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /mettre en ligne/i })).toBeInTheDocument();
});
