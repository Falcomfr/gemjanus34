import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import AdminSettingsPage from "../page";

const single = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn(async () => ({ id: "u1", role: "admin" })) }));
vi.mock("@/app/admin/reglages/actions", () => ({ saveSiteSettings: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({ from: () => ({ select: () => ({ single }) }) })),
}));

test("shows the stored settings in the form", async () => {
  single.mockResolvedValue({ data: { callback_enabled: false, membership_enabled: true, helloasso_url: "https://www.helloasso.com/associations/janus34", gallery_enabled: true }, error: null });

  render(await AdminSettingsPage());

  expect(screen.getByLabelText(/rappelez-moi/i)).not.toBeChecked();
  expect(screen.getByLabelText(/afficher la galerie/i)).toBeChecked();
  expect(screen.getByLabelText(/adresse de la page helloasso/i)).toHaveValue("https://www.helloasso.com/associations/janus34");
});

test("shows an error instead of a form of guessed values when the settings cannot be read", async () => {
  single.mockResolvedValue({ data: null, error: { message: "down" } });

  render(await AdminSettingsPage());

  expect(screen.getByRole("alert")).toHaveTextContent(/n’ont pas pu être chargés/);
  expect(screen.queryByRole("button", { name: /enregistrer/i })).not.toBeInTheDocument();
});
