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
const revisions = [{ id: "r1", title: "Activités", created_at: "2026-10-16T13:12:45Z" }];

test("an administrator corrects a published page without taking it offline", () => {
  render(<PageForm mode="edit" profile={admin} page={page} parentOptions={[]} revisions={revisions} />);

  expect(screen.getByLabelText("Titre")).toBeEnabled();
  expect(screen.getByText(/est en ligne : vos modifications seront visibles/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Enregistrer et mettre en ligne" })).toBeInTheDocument();
});

test("asks before archiving and shows only the latest result", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  render(<PageForm mode="edit" profile={admin} page={page} parentOptions={[]} revisions={revisions} />);

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
