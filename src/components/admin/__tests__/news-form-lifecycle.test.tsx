import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { NewsForm } from "../news-form";

vi.mock("@/app/admin/actualites/actions", () => ({
  createNews: vi.fn(async () => ({})),
  updateNews: vi.fn(async () => ({ success: "Modifications en ligne." })),
  publishNews: vi.fn(async () => ({ success: "Actualité publiée." })),
  archiveNews: vi.fn(async () => ({ success: "Actualité archivée." })),
  restoreNews: vi.fn(async () => ({ success: "Actualité restaurée et republiée." })),
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
