import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { NewsForm } from "../news-form";

vi.mock("@/app/admin/actualites/actions", () => ({
  createNews: vi.fn(async () => ({})),
  updateNews: vi.fn(async () => ({ success: "Modifications en ligne." })),
  publishNews: vi.fn(async () => ({ success: "Actualité publiée." })),
  archiveNews: vi.fn(async () => ({ success: "Actualité archivée." })),
  restoreNews: vi.fn(async () => ({ success: "Actualité restaurée et republiée." })),
  deleteNews: vi.fn(async () => ({ formError: "L’actualité n’a pas pu être supprimée." })),
}));
vi.mock("../rich-text-editor", () => ({ RichTextEditor: () => <div /> }));

const admin = { id: "10000000-0000-0000-0000-000000000001", displayName: "Admin", role: "admin" as const, notifyOnPublish: false };
const news = {
  id: "40000000-0000-4000-8000-000000000001",
  title: "Sortie",
  excerpt: "Résumé",
  content: { type: "doc", content: [] },
  starts_at: "2030-03-10T13:00:00Z",
  ends_at: null,
  featured: false,
  status: "published" as const,
};

test("a published news item can be corrected in place", () => {
  render(<NewsForm mode="edit" profile={admin} news={news} />);

  expect(screen.getByRole("textbox", { name: "Titre" })).toBeEnabled();
  expect(screen.getByText(/est en ligne : vos modifications seront visibles/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Enregistrer et mettre en ligne" })).toBeInTheDocument();
});

test("asks before archiving and shows only the latest result", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  render(<NewsForm mode="edit" profile={admin} news={news} />);

  fireEvent.submit(screen.getByRole("textbox", { name: "Titre" }).closest("form")!);
  expect(await screen.findByText("Modifications en ligne.")).toBeInTheDocument();

  fireEvent.submit(screen.getByRole("button", { name: "Archiver" }).closest("form")!);

  expect(confirm).toHaveBeenCalled();
  expect(await screen.findByText("Actualité archivée.")).toBeInTheDocument();
  expect(screen.queryByText("Modifications en ligne.")).not.toBeInTheDocument();
});

const manager = { id: "10000000-0000-0000-0000-000000000003", displayName: "Gestion", role: "manager" as const, notifyOnPublish: false };
const editor = { id: "10000000-0000-0000-0000-000000000002", displayName: "Elif", role: "editor" as const, notifyOnPublish: false };

test("a manager archives and restores news", () => {
  const { unmount } = render(<NewsForm mode="edit" profile={manager} news={news} />);
  expect(screen.getByRole("button", { name: /archiver/i })).toBeInTheDocument();
  unmount();

  render(<NewsForm mode="edit" profile={manager} news={{ ...news, status: "archived" }} />);
  expect(screen.getByRole("button", { name: /restaurer/i })).toBeInTheDocument();
});

test("an editor cannot archive news", () => {
  render(<NewsForm mode="edit" profile={editor} news={news} />);

  expect(screen.queryByRole("button", { name: /archiver/i })).not.toBeInTheDocument();
});

test("a manager deletes archived news only, after confirming", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  const { unmount } = render(<NewsForm mode="edit" profile={manager} news={news} />);
  expect(screen.queryByRole("button", { name: /supprimer/i })).not.toBeInTheDocument();
  unmount();

  render(<NewsForm mode="edit" profile={manager} news={{ ...news, status: "archived" }} />);
  fireEvent.submit(screen.getByRole("button", { name: "Supprimer définitivement" }).closest("form")!);

  expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/irréversible/));
  expect(await screen.findByText("L’actualité n’a pas pu être supprimée.")).toBeInTheDocument();
});

test("an editor is told who can archive, restore and delete", () => {
  render(<NewsForm mode="edit" profile={editor} news={{ ...news, status: "archived" }} />);

  expect(screen.queryByRole("button", { name: /restaurer|supprimer/i })).not.toBeInTheDocument();
  expect(screen.getByText(/réservés aux administrateurs et aux gestionnaires/)).toBeInTheDocument();
});
