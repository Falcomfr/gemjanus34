import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { PageForm } from "../page-form";

const actionStates = vi.hoisted(() => ({
  values: [] as Array<[Record<string, unknown>, ReturnType<typeof vi.fn>, boolean]>,
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: vi.fn(() => actionStates.values.shift() ?? [{}, vi.fn(), false]),
  };
});

vi.mock("@/app/admin/pages/actions", () => ({
  archivePage: vi.fn(),
  createPage: vi.fn(),
  initialPageActionState: {},
  publishPage: vi.fn(),
  restorePageRevision: vi.fn(),
  updatePage: vi.fn(),
}));

vi.mock("../rich-text-editor", () => ({
  RichTextEditor: ({
    describedBy,
    invalid,
    label,
  }: {
    describedBy?: string;
    invalid?: boolean;
    label: string;
  }) => (
    <div
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      aria-label={label}
      role="textbox"
    />
  ),
}));

const profile = {
  id: "33333333-3333-4333-8333-333333333333",
  displayName: "Admin",
  role: "admin" as const,
  notifyOnPublish: false,
};

const page = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "accueil",
  title: "Accueil",
  summary: "Bienvenue",
  content: { type: "doc", content: [{ type: "paragraph" }] },
  status: "draft" as const,
  navigation_position: 1,
  parent_id: "22222222-2222-4222-8222-222222222222",
};

describe("PageForm query states", () => {
  beforeEach(() => {
    actionStates.values = Array.from({ length: 4 }, () => [{}, vi.fn(), false]);
  });

  test("reports unavailable parent options and prevents saving", () => {
    render(
      <PageForm
        mode="edit"
        profile={profile}
        page={page}
        parentOptions={[]}
        parentOptionsError
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Les pages parentes n’ont pas pu être chargées.",
    );
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
    expect(screen.getByLabelText("Page parente")).toBeDisabled();
  });

  test("reports unavailable revisions instead of a false empty state", () => {
    render(
      <PageForm
        mode="edit"
        profile={profile}
        page={page}
        parentOptions={[]}
        revisionsError
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Les révisions n’ont pas pu être chargées.",
    );
    expect(screen.queryByText("Aucune révision publiée.")).not.toBeInTheDocument();
  });
});

describe("PageForm accessibility", () => {
  beforeEach(() => {
    actionStates.values = Array.from({ length: 4 }, () => [{}, vi.fn(), false]);
  });

  test("announces action feedback and associates field errors with invalid controls", () => {
    actionStates.values[0] = [
      {
        formError: "L’enregistrement a échoué.",
        success: "Page enregistrée.",
        fieldErrors: {
          title: ["Le titre est invalide."],
          content: ["Le contenu est invalide."],
        },
      },
      vi.fn(),
      false,
    ];

    render(
      <PageForm mode="edit" profile={profile} page={page} parentOptions={[]} />,
    );

    expect(screen.getByText("L’enregistrement a échoué.")).toHaveAttribute(
      "aria-live",
      "assertive",
    );
    expect(screen.getByText("Page enregistrée.")).toHaveAttribute("aria-live", "polite");

    const title = screen.getByLabelText("Titre");
    expect(title).toHaveAttribute("aria-invalid", "true");
    expect(title).toHaveAccessibleDescription("Le titre est invalide.");

    const editor = screen.getByRole("textbox", { name: "Contenu de la page" });
    expect(editor).toHaveAttribute("aria-invalid", "true");
    expect(editor).toHaveAccessibleDescription("Le contenu est invalide.");
  });
});
