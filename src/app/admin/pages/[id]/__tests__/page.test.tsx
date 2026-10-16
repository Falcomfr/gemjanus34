import { render } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import EditAdminPage from "../page";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  pageForm: vi.fn(),
  requireProfile: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("@/components/admin/page-form", () => ({
  PageForm: (props: unknown) => {
    mocks.pageForm(props);
    return <div data-testid="page-form" />;
  },
}));

vi.mock("@/lib/auth/require-profile", () => ({
  requireProfile: mocks.requireProfile,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: mocks.createServerClient,
}));

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

function createQuery<T>(initialResult: { data: T; error: unknown }) {
  let result = initialResult;
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    neq: vi.fn((field: string, value: unknown) => {
      if (Array.isArray(result.data)) {
        result = {
          ...result,
          data: result.data.filter((row) => (row as Record<string, unknown>)[field] !== value) as T,
        };
      }
      return query;
    }),
    maybeSingle: vi.fn(async () => result),
    order: vi.fn(async () => result),
  };
  return query;
}

describe("EditAdminPage", () => {
  beforeEach(() => {
    mocks.pageForm.mockClear();
    mocks.requireProfile.mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      displayName: "Admin",
      role: "admin",
      notifyOnPublish: false,
    });
  });

  test("passes revision and parent-option query failures to the form", async () => {
    const queries = [
      createQuery({ data: page, error: null }),
      createQuery({ data: null, error: new Error("revisions failed") }),
      createQuery({ data: null, error: new Error("parents failed") }),
    ];
    mocks.createServerClient.mockResolvedValue({
      from: vi.fn(() => queries.shift()),
    });

    render(await EditAdminPage({ params: Promise.resolve({ id: page.id }) }));

    expect(mocks.pageForm).toHaveBeenCalledWith(
      expect.objectContaining({
        parentOptionsError: true,
        revisionsError: true,
      }),
    );
  });

  test("keeps the selected parent available when it is archived", async () => {
    const archivedParent = {
      id: page.parent_id,
      title: "Ancienne rubrique",
      status: "archived",
    };
    const queries = [
      createQuery({ data: page, error: null }),
      createQuery({ data: [], error: null }),
      createQuery({ data: [archivedParent], error: null }),
    ];
    mocks.createServerClient.mockResolvedValue({
      from: vi.fn(() => queries.shift()),
    });

    render(await EditAdminPage({ params: Promise.resolve({ id: page.id }) }));

    expect(mocks.pageForm).toHaveBeenCalledWith(
      expect.objectContaining({
        parentOptions: [{ id: archivedParent.id, title: archivedParent.title }],
      }),
    );
  });
});

test("answers a malformed page id with a 404, without querying", async () => {
  mocks.requireProfile.mockResolvedValue({ id: "u", role: "admin" });
  mocks.createServerClient.mockReset();

  await expect(EditAdminPage({ params: Promise.resolve({ id: "pas-un-id" }) })).rejects.toThrow("NOT_FOUND");
  expect(mocks.createServerClient).not.toHaveBeenCalled();
});
