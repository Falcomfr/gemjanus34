import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { NewsForm } from "../news-form";
import { PageForm } from "../page-form";

vi.mock("@/app/admin/pages/actions", () => ({
  archivePage: vi.fn(async () => ({})),
  createPage: vi.fn(async () => ({ fieldErrors: { slug: ["Utilisez uniquement des minuscules."] } })),
  initialPageActionState: {},
  publishPage: vi.fn(async () => ({})),
  restorePageRevision: vi.fn(async () => ({})),
  updatePage: vi.fn(async () => ({})),
}));

vi.mock("@/app/admin/actualites/actions", () => ({
  createNews: vi.fn(async () => ({ fieldErrors: { excerpt: ["Le résumé est obligatoire."] } })),
  updateNews: vi.fn(async () => ({})),
  publishNews: vi.fn(async () => ({})),
  archiveNews: vi.fn(async () => ({})),
  restoreNews: vi.fn(async () => ({})),
}));

vi.mock("../rich-text-editor", () => ({ RichTextEditor: () => <div /> }));

const profile = { id: "10000000-0000-0000-0000-000000000001", displayName: "Admin", role: "admin" as const, notifyOnPublish: false };

test("keeps a typed page title after a validation error", async () => {
  const { container } = render(<PageForm mode="create" profile={profile} parentOptions={[]} />);
  const title = container.querySelector<HTMLInputElement>('input[name="title"]')!;
  fireEvent.change(title, { target: { value: "Nouvelle page longue à écrire" } });

  fireEvent.submit(title.form!);

  expect(await screen.findByText("Utilisez uniquement des minuscules.")).toBeInTheDocument();
  expect(title.value).toBe("Nouvelle page longue à écrire");
});

test("keeps a typed news title after a validation error", async () => {
  const { container } = render(<NewsForm mode="create" profile={profile} />);
  const title = container.querySelector<HTMLInputElement>('input[name="title"]')!;
  fireEvent.change(title, { target: { value: "Sortie au musée" } });

  fireEvent.submit(title.form!);

  expect(await screen.findByText("Le résumé est obligatoire.")).toBeInTheDocument();
  expect(title.value).toBe("Sortie au musée");
});
