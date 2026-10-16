import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import AdminMessagesPage from "../page";

vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn() }));
vi.mock("../actions", () => ({ markMessageHandled: vi.fn(), deleteMessage: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        order: async () => ({
          data: [
            { id: "m1", name: "Camille", email: "camille@example.test", subject: "Première visite", message: "Bonjour, je voudrais venir.", created_at: "2026-10-16T10:00:00Z", handled_at: null },
            { id: "m2", name: "Sam", email: "sam@example.test", subject: "Adhésion", message: "Comment adhérer ?", created_at: "2026-10-10T10:00:00Z", handled_at: "2026-10-11T10:00:00Z" },
          ],
          error: null,
        }),
      }),
    }),
  })),
}));

test("shows new messages with a reply link and handling actions", async () => {
  render(await AdminMessagesPage());

  const fresh = screen.getByRole("article", { name: /première visite/i });
  expect(fresh).toHaveTextContent("Nouveau");
  expect(fresh).toHaveTextContent("Bonjour, je voudrais venir.");
  expect(within(fresh).getByRole("link", { name: /répondre/i })).toHaveAttribute(
    "href",
    expect.stringMatching(/^mailto:camille@example\.test\?subject=/),
  );
  expect(within(fresh).getByRole("button", { name: /marquer comme traité/i })).toBeInTheDocument();

  const handled = screen.getByRole("article", { name: /adhésion/i });
  expect(handled).toHaveTextContent("Traité");
  expect(within(handled).queryByRole("button", { name: /marquer comme traité/i })).not.toBeInTheDocument();
});
