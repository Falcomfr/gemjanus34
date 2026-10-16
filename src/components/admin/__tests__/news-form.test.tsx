import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { NewsForm } from "../news-form";

vi.mock("@/app/admin/actualites/actions", () => ({
  createNews: vi.fn(),
  updateNews: vi.fn(),
  publishNews: vi.fn(),
  archiveNews: vi.fn(),
  restoreNews: vi.fn(),
}));

vi.mock("../rich-text-editor", () => ({
  RichTextEditor: ({ disabled, invalid }: { disabled?: boolean; invalid?: boolean }) => (
    <div data-testid="rich-editor" data-disabled={String(disabled)} data-invalid={String(invalid)} />
  ),
}));

const profile = {
  id: "10000000-0000-0000-0000-000000000002",
  displayName: "Éditrice",
  role: "editor" as const,
  notifyOnPublish: true,
};

test("offers editors a deliberate publish action for a draft", () => {
  render(<NewsForm mode="edit" profile={profile} news={{
    id: "40000000-0000-0000-0000-000000000002",
    title: "Atelier",
    excerpt: "Description",
    content: { type: "doc", content: [] },
    starts_at: "2026-10-16T08:30:00+00:00",
    ends_at: null,
    featured: false,
    status: "draft",
  }} />);

  expect(screen.getByRole("button", { name: /publier/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /archiver/i })).not.toBeInTheDocument();
  expect(screen.getByLabelText(/date et heure de début/i)).toHaveAttribute("type", "datetime-local");
});

test("reserves archive and restore controls for administrators", () => {
  const { rerender } = render(<NewsForm mode="edit" profile={{ ...profile, role: "admin" }} news={{
    id: "40000000-0000-0000-0000-000000000001",
    title: "Publiée",
    excerpt: "Description",
    content: { type: "doc", content: [] },
    starts_at: "2026-10-16T08:30:00+00:00",
    ends_at: null,
    featured: false,
    status: "published",
  }} />);

  expect(screen.getByRole("button", { name: /archiver/i })).toBeInTheDocument();

  rerender(<NewsForm mode="edit" profile={{ ...profile, role: "admin" }} news={{
    id: "40000000-0000-0000-0000-000000000003",
    title: "Archivée",
    excerpt: "Description",
    content: { type: "doc", content: [] },
    starts_at: "2026-10-16T08:30:00+00:00",
    ends_at: null,
    featured: false,
    status: "archived",
  }} />);

  expect(screen.getByRole("button", { name: /restaurer/i })).toBeInTheDocument();
});
