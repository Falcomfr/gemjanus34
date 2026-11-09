import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import JoinPage from "../nous-rejoindre/page";

const settings = vi.hoisted(() => ({ current: { callbackEnabled: true, membershipEnabled: false, helloassoUrl: null as string | null } }));
vi.mock("@/lib/settings/site-settings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/settings/site-settings")>()),
  getSiteSettings: vi.fn(async () => settings.current),
}));

beforeEach(() => {
  settings.current = { callbackEnabled: true, membershipEnabled: false, helloassoUrl: null };
});

test("offers the call-me-back form to people who hesitate to phone", async () => {
  render(await JoinPage());

  const callback = screen.getByRole("region", { name: "Rappelez-moi" });
  expect(screen.getByLabelText("Votre téléphone")).toHaveAttribute("type", "tel");
  expect(callback).toHaveTextContent("l’équipe vous rappelle");
  expect(screen.getByRole("button", { name: "Être rappelé" })).toBeInTheDocument();
});

test("hides the call-me-back form when it is switched off", async () => {
  settings.current = { ...settings.current, callbackEnabled: false };

  render(await JoinPage());

  expect(screen.queryByRole("region", { name: "Rappelez-moi" })).not.toBeInTheDocument();
});

test("shows the membership link once it is switched on with an address", async () => {
  settings.current = { ...settings.current, membershipEnabled: true, helloassoUrl: "https://www.helloasso.com/associations/janus34" };

  render(await JoinPage());

  expect(screen.getByRole("link", { name: /adhérer ou faire un don/i })).toHaveAttribute("href", "https://www.helloasso.com/associations/janus34");
});

test("keeps the membership link hidden by default", async () => {
  render(await JoinPage());

  expect(screen.queryByRole("link", { name: /adhérer ou faire un don/i })).not.toBeInTheDocument();
});
