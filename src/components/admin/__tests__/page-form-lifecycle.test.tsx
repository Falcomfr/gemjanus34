import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { PageForm } from "../page-form";

vi.mock("@/app/admin/pages/actions", () => ({
  archivePage: vi.fn(async () => ({ success: "Page archivée." })),
  createPage: vi.fn(async () => ({})),
  initialPageActionState: {},
  publishPage: vi.fn(async () => ({ success: "Page publiée et révision créée." })),
  restorePageRevision: vi.fn(async () => ({ success: "Révision restaurée et publiée." })),
  updatePage: vi.fn(async () => ({ success: "Modifications en ligne." })),
}));
vi.mock("../rich-text-editor", () => ({ RichTextEditor: () => <div /> }));

const admin = { id: "10000000-0000-0000-0000-000000000001", displayName: "Admin", role: "admin" as const, notifyOnPublish: false };
const page = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "activites",
  title: "Activités",
  summary: "Le programme",
  content: { type: "doc", content: [] },
  status: "published" as const,
  navigation_position: null,
  parent_id: null,
};
const revisions = [{ id: "r1", title: "Activités", status: "published" as const, created_at: "2026-10-16T13:12:45Z" }];

test("an administrator corrects a published page without taking it offline", () => {
  render(<PageForm mode="edit" profile={admin} page={page} parentOptions={[]} revisions={revisions} />);

  expect(screen.getByLabelText("Titre")).toBeEnabled();
  expect(screen.getByText(/est en ligne : vos modifications seront visibles/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Enregistrer et mettre en ligne" })).toBeInTheDocument();
});

test("asks before archiving and shows only the latest result", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  render(<PageForm mode="edit" profile={admin} page={{ ...page, slug: "sortie-au-musee" }} parentOptions={[]} revisions={revisions} />);

  fireEvent.submit(screen.getByLabelText("Titre").closest("form")!);
  expect(await screen.findByText("Modifications en ligne.")).toBeInTheDocument();

  fireEvent.submit(screen.getByRole("button", { name: "Archiver" }).closest("form")!);
  expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/retirer cette page/i));
  expect(await screen.findByText("Page archivée.")).toBeInTheDocument();
  expect(screen.queryByText("Modifications en ligne.")).not.toBeInTheDocument();
});

test("asks before restoring a revision and dates it to the second", () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  render(<PageForm mode="edit" profile={admin} page={page} parentOptions={[]} revisions={revisions} />);

  expect(screen.getByText(/15:12:45/)).toBeInTheDocument();
  fireEvent.submit(screen.getByRole("button", { name: /restaurer la révision/i }).closest("form")!);
  expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/remplacer le contenu en ligne/i));
});

test("does not offer to archive a site page, which would bring back the original text", () => {
  render(<PageForm mode="edit" profile={admin} page={page} parentOptions={[]} revisions={revisions} />);

  expect(screen.queryByRole("button", { name: "Archiver" })).not.toBeInTheDocument();
});

const manager = { id: "10000000-0000-0000-0000-000000000003", displayName: "Gestion", role: "manager" as const, notifyOnPublish: false };

test("a manager corrects a published page but keeps its address and cannot archive it", () => {
  render(<PageForm mode="edit" profile={manager} page={{ ...page, slug: "sortie-au-musee" }} parentOptions={[]} revisions={revisions} />);

  expect(screen.getByLabelText("Titre")).toBeEnabled();
  expect(screen.getByText(/est en ligne : vos modifications seront visibles/)).toBeInTheDocument();
  expect(screen.getByLabelText("Adresse de la page")).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Archiver" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /restaurer la révision/i })).toBeInTheDocument();
});

test("a manager puts back online a page that was published before", () => {
  render(<PageForm mode="edit" profile={manager} page={{ ...page, status: "archived" }} parentOptions={[]} revisions={revisions} />);

  expect(screen.getByRole("button", { name: "Publier" })).toBeInTheDocument();
});

test("a manager leaves the first publication of a new page to an administrator", () => {
  render(<PageForm mode="edit" profile={manager} page={{ ...page, status: "draft" }} parentOptions={[]} revisions={[]} />);

  expect(screen.queryByRole("button", { name: "Publier" })).not.toBeInTheDocument();
  expect(screen.getByText("Un administrateur publie les nouvelles pages.")).toBeInTheDocument();
});
