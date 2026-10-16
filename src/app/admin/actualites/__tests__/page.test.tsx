import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import AdminNewsPage from "../page";

const rpc = vi.fn().mockResolvedValue({
  data: [{
    id: "40000000-0000-0000-0000-000000000001",
    title: "Actualité partagée",
    status: "draft",
    starts_at: "2026-10-16T08:30:00Z",
    updated_at: "2026-10-16T08:30:00Z",
    author_display_name: "Autrice collègue",
  }],
  error: null,
});

vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({ rpc })),
}));

test("loads the least-privilege news list and renders another editor's display name", async () => {
  render(await AdminNewsPage());

  expect(rpc).toHaveBeenCalledWith("list_news_with_authors");
  expect(screen.getByText("Autrice collègue")).toBeInTheDocument();
  expect(screen.queryByText("Compte inconnu")).not.toBeInTheDocument();
});
