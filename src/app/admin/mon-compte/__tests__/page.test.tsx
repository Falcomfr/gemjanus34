import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import MyAccountPage from "../page";

vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn(async () => ({ id: "u1", role: "editor", displayName: "Elif" })) }));
vi.mock("../actions", () => ({ updateMyName: vi.fn(), changeMyPassword: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({ auth: { getUser: async () => ({ data: { user: { email: "elif@gemjanus34.fr" } } }) } })),
}));

test("lets everyone change their name and password", async () => {
  render(await MyAccountPage());

  expect(screen.getByRole("heading", { level: 1, name: "Mon compte" })).toBeInTheDocument();
  expect(screen.getByText("elif@gemjanus34.fr")).toBeInTheDocument();
  expect(screen.getByLabelText("Nom affiché")).toHaveValue("Elif");
  expect(screen.getByLabelText("Mot de passe actuel")).toHaveAttribute("type", "password");
  expect(screen.getByLabelText("Nouveau mot de passe")).toHaveAttribute("minlength", "10");
  expect(screen.getByRole("button", { name: "Changer le mot de passe" })).toBeInTheDocument();
});
